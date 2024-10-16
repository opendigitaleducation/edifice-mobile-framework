/**
 * HTML Parser
 * This is a complete new version of the obsolete HtmlConverter.
 *
 * Multiple html parsers are available. This one is the abstract one that renders nothing.
 * - Use the "rn" parser to export react-native elements
 * - Use the "text" parser to export text-only, without formatting.
 *
 * options :
 * - `ignoreClass` An array of classnames that make some tags (and their children) to be ignored by the parser.
 * - `preventZWSP` A boolean that indicates if ZWSP (Zero-Width SPace) charatcers will be removed. Default `true`.
 * - `emptyDiv2Br` A boolean that indicates if an empty div has to be interpreted as a <br/> or not. Default `true`.
 * - `parseEntities` A boolean that indicates if html entities hav to be parsed in text nodes or not. Default `true`.
 * - `fixVoidTags` A boolean that indicated if void tags in the html input string must be fixed. Default `true`
 */
import { decode } from 'html-entities';
import Saxophone from 'saxophone';

import { parseAttrs } from '~/utils/attrs';

export interface IHtmlParserAbstractOptions {
  selectable?: boolean;
  ignoreClass?: string[];
  preventZWSP?: boolean;
  emptyDiv2Br?: boolean;
  parseEntities?: boolean;
  fixVoidTags?: boolean;
}

export class HtmlParserAbstract<RenderType> {
  /**
   * The Saxophone parser instance
   */
  protected saxophone = new Saxophone();

  /**
   * Input HTML as a string.
   */
  protected html: string = undefined;

  /**
   * Output render. As this class is an abstract parser, render can be anything.
   */
  protected render: RenderType = undefined;

  /**
   * Default options values
   */
  public static defaultOpts: IHtmlParserAbstractOptions = {
    emptyDiv2Br: true,
    fixVoidTags: true,
    ignoreClass: [],
    parseEntities: true,
    preventZWSP: true,
    selectable: false,
  };

  /**
   * Provided options
   */
  protected opts: IHtmlParserAbstractOptions;

  /**
   * Current global deepness value. 0 is the root level. A new level is created *inside* each element (only for theirs children).
   */
  protected currentDeepnessLevel: number = 0;

  /**
   * Current deepness level that is ignored from parsing. Is `undefined` when no active ignore.
   */
  protected currentIgnoredDeepnessLevel?: number = undefined;

  /**
   * Is now ignoring all the tag and its content, depending of `currentIgnoredDeepnessLevel` and `currentDeepnessLevel` ?
   */
  protected get isIgnoring() {
    return this.currentIgnoredDeepnessLevel && this.currentDeepnessLevel >= this.currentIgnoredDeepnessLevel;
  }

  // ----------------------------------------------------------------------------------------------

  public constructor(opts?: IHtmlParserAbstractOptions) {
    this.opts = { ...HtmlParserAbstract.defaultOpts, ...opts };
    for (const eventName in this.saxEventHandlersAbstract) {
      if (this.saxEventHandlersAbstract.hasOwnProperty(eventName))
        this.saxophone.on(eventName, this.saxEventHandlersAbstract[eventName]);
    }
  }

  public parse(html: string): RenderType {
    try {
      html = this.beforeParseAbstract(html);
      this.html = html;
      if (!this.html) return null;
      this.saxophone.parse(this.html);
      // Now this.render is available.
      this.render = this.didParseAbstract(this.render);
      return this.render;
    } catch (e) {
      // tslint:disable-next-line:no-console
      throw e;
    }
  }

  protected saxEventHandlersAbstract = {
    tagopen: this.onTagOpenAbstract.bind(this),

    tagclose: this.onTagCloseAbstract.bind(this),

    processinginstruction: this.onProcessingInstructionAbstract.bind(this),

    text: this.onTextAbstract.bind(this),

    cdata: this.onCdataAbstract.bind(this),

    comment: this.onCommentAbstract.bind(this),

    error: this.onErrorAbstract.bind(this),

    finish: this.onFinishAbstract.bind(this),
  };

  // ----------------------------------------------------------------------------------------------
  // Abstract event handlers. @see https://www.npmjs.com/package/saxophone

  protected onTagOpenAbstract(tag: { name: string; attrs: string; isSelfClosing: boolean }) {
    // 0 - Curating input
    const tagName = tag.name.toLowerCase();
    const tagAttrs: { [attr: string]: string } = parseAttrs(tag.attrs);

    // 1 - Compute if the tag needs to be ignored

    let willBeIgnored = false;
    if (this.opts.ignoreClass && tagAttrs.class) {
      const classes = tagAttrs.class.split(' ');

      classes.forEach(className => {
        if (this.opts.ignoreClass?.includes(className)) willBeIgnored = true;
      });

      if (willBeIgnored) {
        this.currentIgnoredDeepnessLevel = this.currentDeepnessLevel;
      }
    }

    // 2 - On tag open, compute the new deepness level (even if tag is being ignored, we need to read all its children to know when tag is closed).
    if (!tag.isSelfClosing || !htmlVoidElements.includes(tagName)) ++this.currentDeepnessLevel;

    // 3 - Call custom event handler if tag is not ignored
    if (!this.isIgnoring && !willBeIgnored && this.onTagOpen)
      this.onTagOpen({
        attrs: tagAttrs,
        isSelfClosing: tag.isSelfClosing,
        name: tagName,
      });
  }

  protected onTagCloseAbstract(tag: { name: string }) {
    // 0 - Curating input
    const tagName = tag.name.toLowerCase();

    // 1 - Compute new deepness level (even if tag is being ignored, we need to read all its children to know when tag is closed).
    if (!htmlVoidElements.includes(tagName)) --this.currentDeepnessLevel;

    if (!this.isIgnoring && this.onTagClose) {
      this.currentIgnoredDeepnessLevel = undefined; // If closing tag is not ignored anymore, we have to erase ignored deepness information.
      this.onTagClose({ name: tagName });
    }
  }

  protected onProcessingInstructionAbstract(instruction: { contents: string }) {
    if (this.isIgnoring) return;
    if (this.onProcessingInstruction) this.onProcessingInstruction(instruction);
  }

  protected onTextAbstract(text: { contents: string }) {
    if (this.isIgnoring) return;
    if (!text.contents) return;
    // if (!text.contents.match(/\S/)) return; // Filter whitespace-only text.
    if (this.opts.parseEntities) text.contents = decode(text.contents);
    if (this.onText) this.onText(text);
  }

  protected onCdataAbstract(cdata: { contents: string }) {
    if (this.isIgnoring) return;
    if (this.onCdata) this.onCdata(cdata);
  }

  protected onCommentAbstract(comment: { contents: string }) {
    if (this.isIgnoring) return;
    if (this.onComment) this.onComment(comment);
  }

  protected onErrorAbstract(error: string) {
    // tslint:disable-next-line:no-console
    if (this.onError) this.onError(error);
  }

  protected onFinishAbstract() {
    if (this.onFinish) this.onFinish();
  }

  /**
   * Called before parsing. Must returns the html that will be parsed. Return `null` or a falsy value to cancel parsing pipeline.
   * Note : `this.html` and `this.render` are not available at this stage of parsing.
   */
  protected beforeParseAbstract(html: string): string {
    if (this.opts.preventZWSP) html = html.replace(/\u200B/g, '');
    if (this.opts.fixVoidTags) html = autoCloseVoidTags(html);
    if (this.opts.emptyDiv2Br) html = html.replace(/<div[^>]*><\/div>/g, '<br/>');
    html = html.replace(/\n\u0020+/g, '\n'); // unindent (brealing space only)
    html = html.replace(/\u0020{2,}/g, ' '); // collapse breaking spaces
    html = '<html>' + html + '</html>'; // html code MUST have a root element. // TODO : use a boolean to know of the <html> tag is already present.
    if (this.beforeParse) html = this.beforeParse(html);
    return html;
  }

  /**
   * Called after parsing. Get parsing result as an argument and must return the parsing result.
   * Note : `this.html` and `this.render` are available at this stage of parsing, but consider not directy write in them.
   */
  protected didParseAbstract(render: RenderType): RenderType {
    if (this.didParse) return this.didParse(render);
    return render;
  }

  // ----------------------------------------------------------------------------------------------
  // Custom event handlers
  // To us them, write some overloads in your custom HtmlParser herited class.

  protected onTagOpen?: (tag: ISaxTagOpen) => void;

  protected onTagClose?: (tag: ISaxTagClose) => void;

  protected onProcessingInstruction?: (instruction: { contents: string }) => void;

  protected onText?: (text: { contents: string }) => void;

  protected onCdata?: (cdata: { contents: string }) => void;

  protected onComment?: (comment: { contents: string }) => void;

  protected onError?: (error: string) => void;

  protected onFinish?: () => void;

  protected beforeParse?: (html: string) => string;

  protected didParse?: (render: RenderType) => RenderType;
}

/**
 * List of self-closing html tags, also knows as "Void Elements".
 * @see HTML specs {@link https://www.w3.org/TR/html5/syntax.html#writing-html-documents-elements}
 */
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

export interface ISaxTagOpen {
  name: string;
  attrs: { [attr: string]: string };
  isSelfClosing: boolean;
}

export interface ISaxTagClose {
  name: string;
}

/**
 * This function takes a html string as an argument and closes every void tag that is not closed.
 * "<br>" are transformed to "<br/>", and so on for every void tag defined in html specification.
 * The reformated html code is returned, the original one is not altered.
 */
export function autoCloseVoidTags(html: string): string {
  const voidTagRegex = new RegExp(`<(\s*(${htmlVoidElements.join('|')})( [^>]*)?)>`, 'g');
  return html.replace(voidTagRegex, (match: string, p1: string, p2: string, offset: number, str: string) =>
    p1.endsWith('/') ? `<${p1}>` : `<${p1}/>`,
  );
}
