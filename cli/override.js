/**
 * Fetch overrides from distant repository and applies them.
 *
 * Usage :
 *
 * node override.js <name>
 * node override.js restore
 * node override.js stash [message]
 * node override.js [un]lock
 * node override.js reset-cache
 *
 * node override.js --help for all commands & options
 *
 */

// As this iss a cli tool, we disable some rules
/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable @typescript-eslint/no-unused-expressions */

/* eslint-disable no-extend-native */

const spawn = require('child_process').spawn;
const deepmerge = require('deepmerge');
const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const util = require('util');
const yargs = require('yargs');
const exec = util.promisify(require('child_process').exec);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// From https://stackoverflow.com/a/21014576/6111343
String.prototype.toUnicode = function () {
  let result = '';
  for (let i = 0; i < this.length; i++) {
    // Assumption: all characters are < 0xffff
    result += '\\u' + ('000' + this[i].charCodeAt(0).toString(16)).substr(-4);
  }
  return result;
};

// All files used in an override are listed below.

// Special files
const _override_entryPoint = 'override.json';
const _override_stashSpecFile = '__stashSpec__';

// Local repo
let _overrides_localRepoName = '__overrides__';
let _overrides_localRepoPath; // Will be computed after;

// Copied files / Merged json files
const _override_copyMergePaths = {
  [_override_entryPoint]: 'override.json', // Applied override information
  i18n: 'assets/i18n/override', // I18n overrides
  '.phrase.yml': './.phrase.yml', // Phrase configuration file
  'phrase.json': './phrase.json', // Phrase secrets
  'appconf.ts': 'src/app/override/appconf.ts', // App configuration + included platforms
  platforms: 'src/platforms', // All possible platforms. Only used ones will be included into the bundle
  'modules.ts': 'src/app/override/modules.ts', // Included modules in the override
  'theme.ts': 'src/app/override/theme.ts', // Theme override
  assets: 'assets', // All specific assets
  'android/google-services.json': 'android/app/google-services.json', // Firebase Android config
  'android/appcenter-config.json': 'android/app/src/main/assets/appcenter-config.json', // AppCenter Android config
  'android/res': 'android/app/src/main/res', // Android specific native assets
  'android/fonts': 'android/app/src/main/assets/fonts', // Android specific fonts
  'android/images': 'android/app/src/main/assets/images', // Android specific images
  'ios/AppCenter-Config.plist': 'ios/appe/AppCenter-Config.plist', // AppCenter iOS config
  'ios/GoogleService-Info.plist': 'ios/appe/GoogleService-Info.plist', // Firebase iOS config
  'ios/Assets.xcassets': 'ios/appe/Assets.xcassets', // iOS specific native assets
  'ios/Fonts': 'ios/Fonts', // iOS specific fonts
  'ios/images': 'ios/appe/images', // iOS specific images
};

// Manual proceeded files
const _override_specialUpdates = {
  'ios.plist': 'ios/appe/Info.plist',
  'ios.pbxproj': 'ios/appe.xcodeproj/project.pbxproj',
  android: 'android/gradle.properties',
};

const _override_forceCopy = [
  'assets/animations/audio/disque.json',
  'android/app/google-services.json',
  'android/app/src/main/assets/appcenter-config.json',
];

// Project constants
const _projectPathAbsolute = process.cwd();

// Global opts (global copy of argv)
let opts;

// ================================================================================================
// ================================================================================================
//
//   Filesystem Util function (all starting by "_")
//
// ================================================================================================
// ================================================================================================

/**
 * Get the @param fileList recursivly from the @param directory.
 * Keep only file paths that match the @param filter.
 * Return absolute filePath
 */
function _walkSync(directory, filelist, filter) {
  const files = fs.readdirSync(directory);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(path.join(directory, file)).isDirectory()) {
      filelist = _walkSync(path.join(directory, file), filelist);
    } else if (!filter || filter(file)) {
      filelist.push(path.join(directory, file));
    }
  });
  return filelist;
}

// ================================================================================================
// ================================================================================================
//
//   Override Util function (all starting by "_ode_")
//
// ================================================================================================
// ================================================================================================

/**
 * Get ode info from package.json without using cache
 */
let _ode_cachePackageJson;
async function _ode_readPackageJson() {
  try {
    const filePath = path.resolve(_projectPathAbsolute, 'package.json');
    const content = await readFile(filePath);
    const packageJson = JSON.parse(content);
    const ode = packageJson.ode;
    if (!ode) {
      throw "Package.json does not contains 'ode' info";
    }
    _ode_cachePackageJson = packageJson;
    return ode;
  } catch (e) {
    console.error("Could not find package.json 'ode' info", e);
  }
}

/**
 * Get package JSON info. If @param newValue is setted, update the package.json
 */
async function _ode_getPackageJsonOde(newValue) {
  const filePath = path.resolve(__dirname, 'package.json');
  if (newValue) {
    _ode_cachePackageJson.ode = newValue;
    await writeFile(filePath, JSON.stringify(_ode_cachePackageJson, null, 2));
    return newValue;
  }
  if (_ode_cachePackageJson) {
    return _ode_cachePackageJson.ode;
  }
  return _ode_readPackageJson();
}

// ================================================================================================
// ================================================================================================
//
//   Ask operations (starting by "ask")
//
// ================================================================================================
// ================================================================================================

/**
 * Fetch override files from a safe repo.
 * The overrides are cloned into a specific directory in the project root.
 */
async function askRepository(uri, branch, username, password) {
  const ode = await _ode_getPackageJsonOde();
  const currentBranch = await _git_getCurrentBranchName();

  const defaultUri = ode.override.url;
  const defaultBranch = currentBranch || ode.override.defaultBranch;

  // 0. Asks for default parameters
  if (uri === 'default') uri = defaultUri;
  if (branch === 'default') branch = defaultBranch;

  // 1. Format paramaters
  const asks = [
    {
      name: 'uri',
      type: 'text',
      required: true,
      initial: defaultUri || '',
      message: 'What is the repository URL?',
      validate: value => value && value.trim().length > 0,
    },
    {
      name: 'branch',
      type: 'text',
      message: 'What branch to pull?       ',
      initial: defaultBranch || '',
    },
    {
      type: 'text',
      name: 'username',
      message: 'What is your username?     ',
    },
    {
      name: 'password',
      type: 'password',
      message: 'What is your password?     ',
    },
  ];
  const needToAsk = Object.entries({ uri, branch, username, password })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([k, v]) => !v)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([k, v]) => asks.find(a => a.name === k));

  if (opts.interactive) {
    const response = await prompts(needToAsk);
    uri = uri || response.uri;
    branch = branch || response.branch;
    username = username || response.username;
    password = password || response.password;
  } else {
    uri = uri || defaultUri;
    branch = branch || defaultBranch;
  }
  return { uri, branch, username, password };
}

/**
 * Ask for override name to apply if the value is not provided as an argument.
 */
async function askOverrideNames(overridesPathAbsolute, overrideNames) {
  if (!overrideNames && opts.interactive) {
    const res = await prompts({
      name: 'overrideNames',
      type: 'text',
      required: true,
      message: 'What override to apply?',
      validate: value => value && value.trim().length > 0,
    });
    overrideNames = overrideNames || res.overrideNames.split(/\s/);
  }
  const overridePathAbsolute = overrideNames.map(ov => path.join(overridesPathAbsolute, ov));
  if (!overridePathAbsolute.every(ovpath => fs.existsSync(ovpath) && fs.statSync(ovpath).isDirectory())) {
    throw new Error(`Overrides "${overrideNames}" doest not exists in given repository`);
  }
  return overrideNames;
}

// ================================================================================================
// ================================================================================================
//
//   Git operations (starting by "_git_")
//
// ================================================================================================
// ================================================================================================

/**
 * Returns current git branch name
 */
async function _git_getCurrentBranchName() {
  const res = await exec('git rev-parse --abbrev-ref HEAD');
  return res.stdout.trim();
}

let _git_RemoteName;
async function _git_getRemoteName() {
  if (_git_RemoteName) return _git_RemoteName;
  const res = await exec('git remote');
  _git_RemoteName = res.stdout.split(/\n/)[0].trim();
  return _git_RemoteName;
}

let _git_repoUri;
function _git_getRepoUri(uri, username, password) {
  if (_git_repoUri) return _git_repoUri;

  // 1. Check uri
  const isHttp = uri.startsWith('http://');
  const isHttps = uri.startsWith('https://');
  if (!isHttp && !isHttps) {
    console.error('The git URI should use HTTP(S) protocol');
    process.exit(1);
  }
  // 2. Get full access uri
  const protocol = isHttp ? 'http://' : 'https://';
  let fullUri = uri;
  if (username) {
    const uriWithoutProtocol = uri.replace(protocol, '');
    if (password) {
      fullUri = protocol + username + ':' + password + '@' + uriWithoutProtocol;
    } else {
      fullUri = protocol + username + '@' + uriWithoutProtocol;
    }
  }
  _git_repoUri = fullUri;
  return fullUri;
}

const _git_refPrefix = 'refs/heads/';
function _git_parseRefs(refsAsString) {
  const refs = refsAsString.split('\n').reduce((acc, refStr) => {
    const refSplitted = refStr.split(/\s+/);
    if (refSplitted.length === 2 && refSplitted[1].startsWith(_git_refPrefix)) {
      acc[refSplitted[1].slice(_git_refPrefix.length)] = refSplitted[0];
    }
    return acc;
  }, {});
  return refs;
}

async function _git_lsRemoteInfo(uri, username, password) {
  const fullUri = _git_getRepoUri(uri, username, password);
  const res = await exec(`git ls-remote ${fullUri}`);
  return _git_parseRefs(res.stdout);
}

async function _git_lsLocalInfo() {
  if (!fs.existsSync(_overrides_localRepoPath)) return undefined;
  const res = await exec(`cd ${_overrides_localRepoName} && git show-ref --heads`);
  return _git_parseRefs(res.stdout);
}

async function _git_isLocalRepoUpToDateForBranch(uri, branch, username, password) {
  const remoteInfo = await _git_lsRemoteInfo(uri, username, password);
  const localInfo = await _git_lsLocalInfo();
  return localInfo && localInfo[branch] && remoteInfo[branch] === localInfo[branch];
}

async function _git_getAvailableBranchName(uri, branch, username, password) {
  const remoteInfo = await _git_lsRemoteInfo(uri, username, password);
  if (!remoteInfo[branch]) {
    const ode = await _ode_getPackageJsonOde();
    const defaultBranch = ode.override.defaultBranch || 'master';
    console.info(`  Branch "${branch}" does not exist. Using "${defaultBranch}" instead.`);
    return defaultBranch;
  }
  return branch;
}

async function _git_CloneRepository(uri, branch, username, password) {
  if (!opts.local) {
    _override_performClean();

    const fullUri = _git_getRepoUri(uri, username, password);

    await new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['clone', '--progress', '--branch', branch, fullUri, _overrides_localRepoPath]);
      gitProcess.on('exit', code => resolve(code));
      gitProcess.on('error', err => reject(err));
      !opts.quiet && gitProcess.stdout.on('data', data => process.stdout.write(data.toString().replace(/(.+)/g, '  $1')));
      !opts.quiet && gitProcess.stderr.on('data', data => process.stderr.write(data.toString().replace(/(.+)/g, '  $1')));
    }).catch(e => {
      console.error(e);
      throw e;
    });
  }
  return _overrides_localRepoPath;
}

async function _git_pullRepository(uri, branch, username, password) {
  if (!opts.local) {
    // Case 1 : no local overrides
    if (!fs.existsSync(_overrides_localRepoPath)) {
      !opts.quiet && console.info('  No local overrides. Cloning repository.');
      return _git_CloneRepository(uri, branch, username, password);
    }

    // Case 2 : local overrides are present AND they are up to date
    if (await _git_isLocalRepoUpToDateForBranch(uri, branch, username, password)) {
      !opts.quiet && console.info(`  Overrides are up to date for branch ${branch}.`);
      return _overrides_localRepoPath;
    }

    // Case 3 : local overrides are present and are NOT up to date.
    !opts.quiet && console.info(`  Overrides needs to be updated for branch ${branch}.`);
    const remote = await _git_getRemoteName();
    await new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['fetch', '--progress', remote, branch], { cwd: _overrides_localRepoPath });
      gitProcess.on('exit', code => resolve(code));
      gitProcess.on('error', err => reject(err));
      !opts.quiet && gitProcess.stdout.on('data', data => process.stdout.write(data.toString().replace(/(.+)/g, '  $1')));
      !opts.quiet && gitProcess.stderr.on('data', data => process.stderr.write(data.toString().replace(/(.+)/g, '  $1')));
    }).catch(e => {
      console.error(e);
      throw e;
    });
    await exec(`cd ${_overrides_localRepoName} && git checkout -B ${branch} && git reset --hard ${remote}/${branch}`);
  }
  return _overrides_localRepoPath;
}

// ================================================================================================
// ================================================================================================
//
//   Override logic (starting by "_override_")
//
// ================================================================================================
// ================================================================================================

/**
 * Walk up all the parents of the given override and returns all the override names.
 * Beware not have circular dependencies !
 */
async function _override_computeStack(overridesPathAbsolute, overrideNames) {
  const ret = new Set();
  const recurse = async current => {
    const stack = new Set();
    if (!fs.existsSync(path.join(overridesPathAbsolute, current, _override_entryPoint))) {
      throw new Error(`Override "${current}" needed but doesn't exists in pulled overrides.`);
    }
    stack.add(current);
    const content = await readFile(path.join(overridesPathAbsolute, current, _override_entryPoint));
    const overrideJson = JSON.parse(content);
    const parents = overrideJson && [...(overrideJson.parent ? [overrideJson.parent] : []), ...(overrideJson.parents || [])];
    for (const p of parents) {
      await recurse(p);
    }
    [...stack].reverse().forEach(v => ret.add(v));
  };
  for (const o of overrideNames) {
    await recurse(o);
  }
  return [...ret];
}

/**
 * Computes a list of files that needs to be copied to apply the override.
 * This includes all files found by walking all the paths prensent in `copyOverrideElements`.
 */
async function _override_computeCopyMergeList(overridesPathAbsolute, overrideName) {
  const overridePathAbsolute = path.join(overridesPathAbsolute, overrideName);
  const copyFiles = [...Object.entries(_override_copyMergePaths)]
    .map(([from, to]) => {
      const fromAbs = path.join(overridePathAbsolute, from);
      const toAbs = path.join(_projectPathAbsolute, to);
      if (fs.existsSync(fromAbs)) {
        const fromAbsStat = fs.statSync(fromAbs);
        if (fromAbsStat.isDirectory()) {
          const fromFilesAbs = _walkSync(fromAbs);
          return fromFilesAbs.map(fromFileAbs => {
            const fromFileRelativeToProject = path.relative(_projectPathAbsolute, fromFileAbs);
            const fromFileRelativeToFromAbs = path.relative(fromAbs, fromFileAbs);
            const toFileAbs = path.join(toAbs, fromFileRelativeToFromAbs);
            const toFileRelativeToProject = path.relative(_projectPathAbsolute, toFileAbs);
            return [fromFileRelativeToProject, toFileRelativeToProject];
          });
        } else if (fromAbsStat.isFile) {
          const toPath = path.join(_projectPathAbsolute, to);
          return [[path.relative(_projectPathAbsolute, fromAbs), path.relative(_projectPathAbsolute, toPath)]];
        } else {
          //console.warn(`${fromAbs} is nor a file or a directory`);
        }
      } else {
        // console.log(`${fromAbs} does not exist`);
      }
    })
    .filter(i => !!i)
    .reduce((acc, item) => (Array.isArray(item) ? [...acc, ...item] : [...acc, item]), []);

  return copyFiles;
}

async function _override_readCurrent() {
  const overrideMainFilePathAbsolute = path.join(_projectPathAbsolute, _override_entryPoint);
  if (!fs.existsSync(overrideMainFilePathAbsolute)) {
    opts.verbose && console.warn('No override is currently applied.');
    return;
  }
  const content = await readFile(overrideMainFilePathAbsolute);
  const overrideJson = JSON.parse(content);
  return overrideJson;
}

/**
 * Return a list of all files that have be created/modified by any override.
 */
async function _override_getCreatedModifiedFiles() {
  const overrideJson = await _override_readCurrent();
  if (!overrideJson) return;

  const matchFiles = [...Object.keys(overrideJson.files || []), ...Object.values(overrideJson.specialUpdates || [])];
  return matchFiles;
}

/**
 * Returns the list of files that have been updated by the override
 * That use their git status to determine if a file has been modified.
 * So, if the developer commit a change in a overriden file, its changes will be kept forever.
 */
async function _override_computeUncommittedFiles() {
  // 1. Get files lists

  const matchFiles = await _override_getCreatedModifiedFiles();
  if (!matchFiles) return;

  // 2. Get uncommitted files

  const res = await exec('git status --porcelain --no-renames -uall');
  const lines = res.stdout.split('\n');
  const uncommittedFiles = lines
    .map(line => line.split(/\s+/).filter(v => v))
    .filter(v => v.length)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([status, path]) => matchFiles.includes(path));

  return uncommittedFiles;
}

/**
 * Returns the list of files that have been updated by the override then locked
 * That use their git ls-files status to determine if a file has been locked.
 */
async function _override_computeLockedFiles() {
  // 1. Get files lists

  const matchFiles = await _override_getCreatedModifiedFiles();

  // 2. Get skip-worktree files
  try {
    const res = await exec(`git ls-files -v | grep '^S'`);
    const lines = res.stdout.split('\n');
    const lockedFiles = lines
      .map(line => line.split(/\s+/).filter(v => v))
      .filter(v => v.length)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([status, path]) => matchFiles.includes(path));

    return lockedFiles;
  } catch (e) {
    // No to do this because grep returns 1 when no match
    if (e.code === 1) {
      return [];
    } else throw e;
  }
}

/**
 * Perform the copy/merge of all the files of an override into the working copy.
 */
async function _override_performCopyMerge(overridesPathAbsolute, overrideName) {
  // 1. Compute copy-list
  const copyFiles = await _override_computeCopyMergeList(overridesPathAbsolute, overrideName);

  // 2. Execute copy-list
  copyFiles.forEach(cp => {
    fs.mkdirSync(path.dirname(cp[1]), { recursive: true });
    if (!_override_forceCopy.includes(cp[1]) && /.json$/.test(cp[0]) && fs.existsSync(cp[1])) {
      // JSON files are deeply merged to each other in the override stack.
      opts.verbose && console.info(`Merging JSON :\r`);
      opts.verbose && console.info(`  from: "${cp[0]}"\r`);
      opts.verbose && console.info(`  into: "${cp[1]}"\r`);
      const previousData = JSON.parse(fs.readFileSync(cp[1]));
      const newData = JSON.parse(fs.readFileSync(cp[0]));
      const mergedData = previousData ? deepmerge(previousData, newData) : newData;
      fs.writeFileSync(cp[1], JSON.stringify(mergedData, undefined, 4));
    } else {
      // Other files are simple copied over.
      opts.verbose && console.info(`Copying :\r`);
      opts.verbose && console.info(`  from: "${cp[0]}"\r`);
      opts.verbose && console.info(`    to: "${cp[1]}"\r`);
      fs.copyFileSync(cp[0], cp[1]);
    }
  });

  return copyFiles;
}

/**
 * Updates the iOS & Android project files based on the current override information (in override.json)
 */
async function _override_performSpecialUpdates() {
  const ret = [];

  // 1. Gather required information
  const overrideJson = await _override_readCurrent();
  if (!overrideJson) return;

  if (!(overrideJson.appid || (overrideJson['appid.ios'] && overrideJson['appid.android'])))
    throw new Error(`Missing appid information in ${_override_entryPoint}.`);
  const appidIos = overrideJson['appid.ios'] || overrideJson.appid;
  const appidAndroid = overrideJson['appid.android'] || overrideJson.appid;
  if (!(overrideJson.appname || (overrideJson['appname.ios'] && overrideJson['appname.android'])))
    throw new Error(`Missing appname information in ${_override_entryPoint}.`);
  const appnameIos = overrideJson['appname.ios'] || overrideJson.appname;
  const appnameAndroid = overrideJson['appname.android'] || overrideJson.appname;
  if (!overrideJson.override) throw new Error(`Missing override information in ${_override_entryPoint}.`);
  const override = overrideJson.override;

  // 2. iOS plist
  const infoPlistPath = path.resolve(_projectPathAbsolute, _override_specialUpdates['ios.plist']);
  let infoPlist = await readFile(infoPlistPath, { encoding: 'utf-8' });
  infoPlist = infoPlist
    .replace(/(<key>CFBundleIdentifier<\/key>\s*<string>)(.*)(<\/string>)/, '$1' + appidIos + '$3')
    .replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)(.*)(<\/string>)/, '$1' + appnameIos + '$3')
    .replace(/(<key>BundleVersionOverride<\/key>\s*<string>)(.*)(<\/string>)/, '$1' + override + '$3');
  opts.verbose && console.info(`Update ${_override_specialUpdates['ios.plist']}`);
  await writeFile(infoPlistPath, infoPlist);
  ret.push(_override_specialUpdates['ios.plist']);

  // 3. iOS pbxproj
  const pbxprojPath = path.resolve(_projectPathAbsolute, _override_specialUpdates['ios.pbxproj']);
  let pbxproj = await readFile(pbxprojPath, { encoding: 'utf-8' });
  pbxproj = pbxproj.replace(/(PRODUCT_BUNDLE_IDENTIFIER = )(.*)(;)/g, '$1' + appidIos + '$3');
  opts.verbose && console.info(`Update ${_override_specialUpdates['ios.pbxproj']}`);
  await writeFile(pbxprojPath, pbxproj);
  ret.push(_override_specialUpdates['ios.pbxproj']);

  // 4. Android Gradle Properties
  const gradlePropertiesPath = path.resolve(_projectPathAbsolute, _override_specialUpdates.android);
  let gradleProperties = await readFile(gradlePropertiesPath, { encoding: 'utf-8' });
  gradleProperties = gradleProperties
    .replace(/(APPID=)(.*)/, '$1' + appidAndroid)
    .replace(/(APPNAME=)(.*)/, '$1' + appnameAndroid.toUnicode())
    .replace(/(APPOVERRIDE=)(.*)/, '$1' + override);
  opts.verbose && console.info(`Update ${_override_specialUpdates.android}`);
  await writeFile(gradlePropertiesPath, gradleProperties);
  ret.push(_override_specialUpdates.android);

  return ret;
}

/**
 * Perform a git restore to all files that have been added/modified by the current override.
 */
async function _override_performRestoreCurrent() {
  // 0. Unlock

  await _override_performUnlock();

  // 1. Get file list

  const uncommittedFiles = await _override_computeUncommittedFiles();
  if (!uncommittedFiles) return;

  // 2. Remove / restore files

  for (const [status, file] of uncommittedFiles) {
    if (status === '??') {
      opts.verbose && console.info('Removing', file);
      fs.rmSync(path.join(_projectPathAbsolute, file));
    } else {
      opts.verbose && console.info('Restoring', file);
      await exec('git restore -W -S ' + file);
    }
  }
}

/**
 * Perform a git stash to all files that have been added/modified by the current override.
 */
async function _override_performStashCurrent(message) {
  // 0. Unlock

  await _override_performUnlock();

  // 1. Get file list & override info

  const uncommittedFiles = await _override_computeUncommittedFiles();
  if (!uncommittedFiles) return;

  const overrideJson = await _override_readCurrent();
  if (!overrideJson) return;

  // 2. Create spec file

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const specString = uncommittedFiles.map(([status, file]) => file).join('\n');
  const specFilePath = path.join(_projectPathAbsolute, _override_stashSpecFile);
  fs.writeFileSync(specFilePath, specString);

  // 3. Git stash
  let gitCmd = `git stash -u --pathspec-from-file "${specFilePath}"`;
  if (!message) message = `Override "${overrideJson.override}"`;
  if (message) gitCmd += ` -m "${message}"`;
  await exec(gitCmd);

  // 4. Rm spec file
  fs.rmSync(specFilePath);
}

/**
 * Create an special git ignore file containing every file corresponding to the current override
 */
async function _override_performLock() {
  const overrideJson = await _override_readCurrent();
  if (!overrideJson) return;

  // 1. Get file list
  const filesToLock = await _override_computeUncommittedFiles();
  if (!filesToLock) return;
  const filesToIgnore = [];

  for (const [status, filepath] of filesToLock) {
    if (status === '??') {
      filesToIgnore.push(filepath);
    } else {
      await exec(`git update-index --skip-worktree "${filepath}"`);
    }
  }
  if (!fs.existsSync('.git/info/exclude.backup')) {
    fs.copyFileSync('.git/info/exclude', '.git/info/exclude.backup');
  }
  fs.appendFileSync(
    '.git/info/exclude',
    `
# === Override exclude files ===
${filesToIgnore.join('\n')}
# === End override exclude files ===
    `,
  );
}

async function _override_performUnlock() {
  const overrideJson = await _override_readCurrent();
  if (!overrideJson) return;

  // 1. Get file list
  const filesToUnlock = await _override_computeLockedFiles();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [status, filepath] of filesToUnlock) {
    await exec(`git update-index --no-skip-worktree "${filepath}"`);
  }

  if (fs.existsSync('.git/info/exclude.backup')) {
    fs.copyFileSync('.git/info/exclude.backup', '.git/info/exclude');
    fs.rmSync('.git/info/exclude.backup');
  }
}

/**
 * removes overrides cache
 */
function _override_performClean() {
  fs.existsSync(_overrides_localRepoPath) && fs.rmSync(_overrides_localRepoPath, { force: true, recursive: true });
  opts.verbose && console.info('Overrides cache has been removed.');
}

/**
 * Apply the override of the given name.
 */
async function _override_performApply(overrideNames, given_uri, given_branch, given_username, given_password) {
  let computedOverrideNames = overrideNames && overrideNames.map(ons => ons.split(/\s+/)).flat();
  if (opts.clean && !opts.local) {
    _override_performClean();
  }
  let { uri, branch, username, password } =
    !opts.local && (await askRepository(given_uri, given_branch, given_username, given_password));
  if (!opts.local) branch = await _git_getAvailableBranchName(uri, branch, username, password);
  const overridesPath = await _git_pullRepository(uri, branch, username, password);
  const allFilesCopied = {};

  // Compute stack

  // eslint-disable-next-line no-undef
  if (!computedOverrideNames) computedOverrideNames = await askOverrideNames(overridesPathAbsolute, overrideNames);
  const overrideStack = await _override_computeStack(overridesPath, computedOverrideNames);

  // 0. Restore previous override if any

  await _override_performRestoreCurrent();

  // 1. Applies overrides stack

  opts.verbose && console.info('Override stack :', overrideStack);
  // eslint-disable-next-line no-undef
  for (override of overrideStack) {
    // eslint-disable-next-line no-undef
    opts.verbose && console.info('Applying override', override);
    // eslint-disable-next-line no-undef
    const filesCopied = await _override_performCopyMerge(overridesPath, override);

    // Merge files information
    Object.assign(
      allFilesCopied,
      Object.fromEntries(filesCopied.map(([cpto, cpfrom]) => [cpfrom, [...(allFilesCopied[cpfrom] || []), cpto]])),
    );
  }

  // 2. Update native project files
  const specialUpdates = await _override_performSpecialUpdates();

  // 3. Writes down dump copy list
  const overrideMainFilePathAbsolute = path.join(_projectPathAbsolute, _override_entryPoint);
  const content = await readFile(overrideMainFilePathAbsolute);
  // Populate override.json
  const overrideJson = JSON.parse(content);
  overrideJson.files = allFilesCopied;
  overrideJson.specialUpdates = specialUpdates;
  overrideJson.stack = overrideStack;
  overrideJson.override = computedOverrideNames.join(' ');
  delete overrideJson.parent;
  await writeFile(overrideMainFilePathAbsolute, JSON.stringify(overrideJson, undefined, 4));

  // 4. Lock override if asked
  opts.lock && (await _override_performLock());
}

/**
 * Main script.
 * Parse command args & execute
 */
const main = () => {
  yargs
    .showHelpOnFail(false, 'Specify --help for available options')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .fail(function (msg, err, _yargs) {
      msg && console.error(msg);
      console.error(err);
      process.exit(1);
    })
    .command(
      ['$0 [overrides..]', 'apply [overrides..]'],
      'fetch and applies an override to the current working copy',
      yargs => {
        yargs
          .positional('overrides', {
            type: 'string',
            describe: 'name of the override to switch to. Can apply multiple overrides at once',
          })
          .option('uri', {
            type: 'string',
            describe: 'uri of the git repo (uri could include password and username)',
            alias: 'h',
          })
          .option('branch', {
            type: 'string',
            describe: 'branch of the git repo',
            alias: 'b',
          })
          .option('username', {
            type: 'string',
            describe: 'username of the git repo',
            alias: 'u',
          })
          .option('password', {
            type: 'string',
            describe: 'password of the git repo',
            alias: 'p',
          })
          .option('verbose', {
            type: 'boolean',
            describe: 'print apply information into stdout',
            alias: 'v',
          })
          .option('quiet', {
            type: 'boolean',
            describe: 'do not print anything not needed.',
            alias: 'q',
          })
          .option('local', {
            type: 'boolean',
            describe: 'use this to assume previously cloned overrides are up to date.',
          })
          .option('lock', {
            type: 'boolean',
            describe: "lock override after apply so modified files won't show in git status.",
            alias: 'l',
          })
          .option('message', {
            type: 'string',
            describe: 'use as stash message (if used with stash subcommand)',
            alias: 'm',
          })
          .option('reset-cache', {
            type: 'boolean',
            describe: 'Remove overrides cache to force clone again',
            alias: 'r',
          })
          .option('interactive', {
            type: 'boolean',
            describe:
              'Enables/disables user prompts. When "-no-prompt" is given, if required info is not provided, executions fails. (Default true)',
            alias: 'i',
            default: true,
          });
      },
      argv => {
        opts = argv;
        if (argv.overrides && argv.overrides.length === 1) {
          if (argv.overrides[0] === 'restore') return _override_performRestoreCurrent();
          else if (argv.overrides[0] === 'lock') return _override_performLock();
          else if (argv.overrides[0] === 'unlock') return _override_performUnlock();
          else if (argv.overrides[0] === 'stash') return _override_performStashCurrent(argv.message);
          else if (argv.overrides[0] === 'clean') return _override_performClean();
        }
        return _override_performApply(argv.overrides, argv.uri, argv.branch, argv.username, argv.password);
      },
    )
    .command(
      'restore',
      'remove modifications caused by the current override',
      yargs => {
        yargs
          .option('verbose', {
            type: 'boolean',
            describe: 'print restore information into stdout',
            alias: 'v',
          })
          .option('quiet', {
            type: 'boolean',
            describe: 'do not print anything not needed.',
            alias: 'q',
          });
      },
      argv => {
        opts = argv;
        _override_performRestoreCurrent();
      },
    )
    .command(
      'stash',
      'shash modifications caused by the current override',
      yargs => {
        yargs
          .option('verbose', {
            type: 'boolean',
            describe: 'print restore information into stdout',
            alias: 'v',
          })
          .option('quiet', {
            type: 'boolean',
            describe: 'do not print anything not needed.',
            alias: 'q',
          })
          .option('message', {
            type: 'string',
            describe: 'use as stash message',
            alias: 'm',
          });
      },
      argv => {
        opts = argv;
        _override_performStashCurrent(argv.message);
      },
    )
    .command(
      'lock',
      'Hides overrided files from git status',
      yargs => {
        yargs
          .option('verbose', {
            type: 'boolean',
            describe: 'print restore information into stdout',
            alias: 'v',
          })
          .option('quiet', {
            type: 'boolean',
            describe: 'do not print anything not needed.',
            alias: 'q',
          });
      },
      argv => {
        opts = argv;
        _override_performLock();
      },
    )
    .command(
      'unlock',
      'Reveal hidden overrided files from git status',
      yargs => {
        yargs
          .option('verbose', {
            type: 'boolean',
            describe: 'print restore information into stdout',
            alias: 'v',
          })
          .option('quiet', {
            type: 'boolean',
            describe: 'do not print anything not needed.',
            alias: 'q',
          });
      },
      argv => {
        opts = argv;
        _override_performUnlock();
      },
    )
    .command(
      'reset-cache',
      'Remove overrides cache',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      yargs => {},
      argv => {
        opts = argv;
        _override_performClean();
      },
    ).argv;
};

// Init local repo values
_ode_getPackageJsonOde().then(ode => {
  _overrides_localRepoName = ode.override.cacheDirectory || _overrides_localRepoName;
  _overrides_localRepoPath = path.resolve('.', _overrides_localRepoName);

  main();
});
