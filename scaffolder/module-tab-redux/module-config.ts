import theme from '~/app/theme';
import { {{moduleName | toCamelCase | capitalize}}State } from '~/framework/modules/{{moduleName}}/reducer';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'{{moduleName | toCamelCase}}', {{moduleName | toCamelCase | capitalize}}State>({
  name: '{{moduleName | toCamelCase}}',
  entcoreScope: [
    /* @scaffolder add there entcore scope list that be required for your module */
  ],
  matchEntcoreApp: entcoreApp => true, // @scaffolder Replace this with a function that returns boolean regarding of the given entcoreApp
  storageName: '{{moduleName | toCamelCase}}',

  displayI18n: '{{moduleName | toCamelCase}}.tabName',
  displayAs: 'tabModule',
  displayOrder: 0,
  displayPicture: { type: 'Svg', name: 'ui-tool' },
});
