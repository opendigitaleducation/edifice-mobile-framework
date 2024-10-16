/**
 * HtmlConverter
 *
 * All functions and tools to interpret HTML rich content.
 * Basically, HTML content can be turned into a flat text (i.e. without rich content), or translated into a React Native content. (with rich content).
 * Both interpreters use SAX as a HTML parser and return either a string or a JSX Element.
 *
 * The JSX interpreter can ignore some rich content types using his `ignore` and/or his `mode` attribute.
 *
 * Warning : parsing and interpreting are costly, don't overuse it. Be sure to cache the result to be not computed again.
 *
 * @param opts object conversion options : {
 *   ignoreClasses: string[] class anmes of tag that will be ignored from parsing.
 * }
 */
import sax from 'sax';

export interface IHtmlConverterOptions {
  ignoreClasses?: string[];
}

export class HtmlConverter {
  // tslint:disable-next-line:variable-name
  protected _html: string; /// input data
  public get html() {
    return this._html;
  }
  public setHtml(html: string) {
    this._html = html;
    this.processHtml();
  }

  // tslint:disable-next-line:variable-name
  protected _render: any; /// output
  public get render() {
    return this._render;
  }

  protected parser; /// The sax parser

  /**
   * Converter options
   */
  public static defaultOpts: IHtmlConverterOptions = {
    ignoreClasses: [],
  };
  protected opts: IHtmlConverterOptions;

  /**
   * Current absolute deepness level, computed with all tags.
   */
  protected absoluteDeepnessLevel: number = 0;

  /**
   * Ignore current deepness level
   */
  protected ignoreDeepnessLevel: number = undefined;

  protected isIgnoring = () => this.ignoreDeepnessLevel && this.absoluteDeepnessLevel >= this.ignoreDeepnessLevel;

  protected getParsingEventHandlers() {
    return {
      onclosetag: (tagName: string) => {
        if (!htmlVoidElements.includes(tagName)) --this.absoluteDeepnessLevel;
        if (this.isIgnoring()) return null;
        this.ignoreDeepnessLevel = undefined;
        return tagName;
      },
      onend: () => {},
      onerror: (err: Error) => {
        this.parser.error = null;
        this.parser.resume();
      },
      onopentag: (tag: sax.Tag) => {
        if (!htmlVoidElements.includes(tag.name)) ++this.absoluteDeepnessLevel;

        if (this.opts.ignoreClasses && tag.attributes.class) {
          const classes = tag.attributes.class.split(' ');
          let willBeIgnored = false;

          classes.forEach(className => {
            if (this.opts.ignoreClasses.includes(className)) willBeIgnored = true;
          });

          if (willBeIgnored) {
            this.ignoreDeepnessLevel = this.absoluteDeepnessLevel;
          }
        }

        if (this.isIgnoring()) tag.name = null;
        return tag;
      },
      ontext: (text: string) => {
        // text = text.replace(/\u200B/g, ""); // remowe ZWSP (Zero-Width SPace) fucking character !
        if (this.isIgnoring()) return null;
        if (!text) return '';
        if (text.match(/\S/)) return text; // Filter whitespace-only strings.
        return ' ';
      },
    };
  }

  public constructor(html: string, opts?: IHtmlConverterOptions) {
    this.opts = { ...HtmlConverter.defaultOpts, ...opts };
    html = html.replace(/\u200B/g, '').replace('<div></div>', '<br/>'); // remowe ZWSP (Zero-Width SPace) fucking character AND replace empty <div>s by <br>
    this._html = '<body>' + html + '</body>'; // html code MUST have a root element. // TODO : use a boolean to know of the <body> tag is already present.
    this.initSaxParser();
    // In child class, don't forget to call processHtml() !
  }

  protected postConstruct() {
    this.processHtml();
  }

  protected processHtml() {
    // Implement it in child classed
    throw new Error('HtmlConverter.processHtml() is an abstract method.');
  }

  protected parse() {
    this.parser.write(this.html).close();
  }

  protected initSaxParser() {
    this.parser = sax.parser(false, {
      lowercase: true,
      normalize: true,
      position: false,
      strictEntities: false, // TS-ISSUE : Definitly Typed issue, it does exists in sax
      trim: false,
    });
    Object.assign(this.parser, this.getParsingEventHandlers());
  }
}

// List from HTML specs https://www.w3.org/TR/html5/syntax.html#writing-html-documents-elements
export const htmlVoidElements = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];
