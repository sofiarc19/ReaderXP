(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@mozilla/readability/Readability.js
  var require_Readability = __commonJS({
    "node_modules/@mozilla/readability/Readability.js"(exports, module) {
      function Readability2(doc, options) {
        if (options && options.documentElement) {
          doc = options;
          options = arguments[2];
        } else if (!doc || !doc.documentElement) {
          throw new Error(
            "First argument to Readability constructor should be a document object."
          );
        }
        options = options || {};
        this._doc = doc;
        this._docJSDOMParser = this._doc.firstChild.__JSDOMParser__;
        this._articleTitle = null;
        this._articleByline = null;
        this._articleDir = null;
        this._articleSiteName = null;
        this._attempts = [];
        this._metadata = {};
        this._debug = !!options.debug;
        this._maxElemsToParse = options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
        this._nbTopCandidates = options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
        this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
        this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(
          options.classesToPreserve || []
        );
        this._keepClasses = !!options.keepClasses;
        this._serializer = options.serializer || function(el) {
          return el.innerHTML;
        };
        this._disableJSONLD = !!options.disableJSONLD;
        this._allowedVideoRegex = options.allowedVideoRegex || this.REGEXPS.videos;
        this._linkDensityModifier = options.linkDensityModifier || 0;
        this._flags = this.FLAG_STRIP_UNLIKELYS | this.FLAG_WEIGHT_CLASSES | this.FLAG_CLEAN_CONDITIONALLY;
        if (this._debug) {
          let logNode = function(node) {
            if (node.nodeType == node.TEXT_NODE) {
              return `${node.nodeName} ("${node.textContent}")`;
            }
            let attrPairs = Array.from(node.attributes || [], function(attr) {
              return `${attr.name}="${attr.value}"`;
            }).join(" ");
            return `<${node.localName} ${attrPairs}>`;
          };
          this.log = function() {
            if (typeof console !== "undefined") {
              let args = Array.from(arguments, (arg) => {
                if (arg && arg.nodeType == this.ELEMENT_NODE) {
                  return logNode(arg);
                }
                return arg;
              });
              args.unshift("Reader: (Readability)");
              console.log(...args);
            } else if (typeof dump !== "undefined") {
              var msg = Array.prototype.map.call(arguments, function(x) {
                return x && x.nodeName ? logNode(x) : x;
              }).join(" ");
              dump("Reader: (Readability) " + msg + "\n");
            }
          };
        } else {
          this.log = function() {
          };
        }
      }
      Readability2.prototype = {
        FLAG_STRIP_UNLIKELYS: 1,
        FLAG_WEIGHT_CLASSES: 2,
        FLAG_CLEAN_CONDITIONALLY: 4,
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        // Max number of nodes supported by this parser. Default: 0 (no limit)
        DEFAULT_MAX_ELEMS_TO_PARSE: 0,
        // The number of top candidates to consider when analysing how
        // tight the competition is among candidates.
        DEFAULT_N_TOP_CANDIDATES: 5,
        // Element tags to score by default.
        DEFAULT_TAGS_TO_SCORE: "section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),
        // The default number of chars an article must have in order to return a result
        DEFAULT_CHAR_THRESHOLD: 500,
        // All of the regular expressions in use within readability.
        // Defined up here so we don't instantiate them repeatedly in loops.
        REGEXPS: {
          // NOTE: These two regular expressions are duplicated in
          // Readability-readerable.js. Please keep both copies in sync.
          unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
          okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i,
          positive: /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
          negative: /-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,
          extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
          byline: /byline|author|dateline|writtenby|p-author/i,
          replaceFonts: /<(\/?)font[^>]*>/gi,
          normalize: /\s{2,}/g,
          videos: /\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,
          shareElements: /(\b|_)(share|sharedaddy)(\b|_)/i,
          nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
          prevLink: /(prev|earl|old|new|<|«)/i,
          tokenize: /\W+/g,
          whitespace: /^\s*$/,
          hasContent: /\S$/,
          hashUrl: /^#.+/,
          srcsetUrl: /(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,
          b64DataUrl: /^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,
          // Commas as used in Latin, Sindhi, Chinese and various other scripts.
          // see: https://en.wikipedia.org/wiki/Comma#Comma_variants
          commas: /\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,
          // See: https://schema.org/Article
          jsonLdArticleTypes: /^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,
          // used to see if a node's content matches words commonly used for ad blocks or loading indicators
          adWords: /^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,
          loadingWords: /^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu
        },
        UNLIKELY_ROLES: [
          "menu",
          "menubar",
          "complementary",
          "navigation",
          "alert",
          "alertdialog",
          "dialog"
        ],
        DIV_TO_P_ELEMS: /* @__PURE__ */ new Set([
          "BLOCKQUOTE",
          "DL",
          "DIV",
          "IMG",
          "OL",
          "P",
          "PRE",
          "TABLE",
          "UL"
        ]),
        ALTER_TO_DIV_EXCEPTIONS: ["DIV", "ARTICLE", "SECTION", "P", "OL", "UL"],
        PRESENTATIONAL_ATTRIBUTES: [
          "align",
          "background",
          "bgcolor",
          "border",
          "cellpadding",
          "cellspacing",
          "frame",
          "hspace",
          "rules",
          "style",
          "valign",
          "vspace"
        ],
        DEPRECATED_SIZE_ATTRIBUTE_ELEMS: ["TABLE", "TH", "TD", "HR", "PRE"],
        // The commented out elements qualify as phrasing content but tend to be
        // removed by readability when put into paragraphs, so we ignore them here.
        PHRASING_ELEMS: [
          // "CANVAS", "IFRAME", "SVG", "VIDEO",
          "ABBR",
          "AUDIO",
          "B",
          "BDO",
          "BR",
          "BUTTON",
          "CITE",
          "CODE",
          "DATA",
          "DATALIST",
          "DFN",
          "EM",
          "EMBED",
          "I",
          "IMG",
          "INPUT",
          "KBD",
          "LABEL",
          "MARK",
          "MATH",
          "METER",
          "NOSCRIPT",
          "OBJECT",
          "OUTPUT",
          "PROGRESS",
          "Q",
          "RUBY",
          "SAMP",
          "SCRIPT",
          "SELECT",
          "SMALL",
          "SPAN",
          "STRONG",
          "SUB",
          "SUP",
          "TEXTAREA",
          "TIME",
          "VAR",
          "WBR"
        ],
        // These are the classes that readability sets itself.
        CLASSES_TO_PRESERVE: ["page"],
        // These are the list of HTML entities that need to be escaped.
        HTML_ESCAPE_MAP: {
          lt: "<",
          gt: ">",
          amp: "&",
          quot: '"',
          apos: "'"
        },
        /**
         * Run any post-process modifications to article content as necessary.
         *
         * @param Element
         * @return void
         **/
        _postProcessContent(articleContent) {
          this._fixRelativeUris(articleContent);
          this._simplifyNestedElements(articleContent);
          if (!this._keepClasses) {
            this._cleanClasses(articleContent);
          }
        },
        /**
         * Iterates over a NodeList, calls `filterFn` for each node and removes node
         * if function returned `true`.
         *
         * If function is not passed, removes all the nodes in node list.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param Function filterFn the function to use as a filter
         * @return void
         */
        _removeNodes(nodeList, filterFn) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _removeNodes");
          }
          for (var i = nodeList.length - 1; i >= 0; i--) {
            var node = nodeList[i];
            var parentNode = node.parentNode;
            if (parentNode) {
              if (!filterFn || filterFn.call(this, node, i, nodeList)) {
                parentNode.removeChild(node);
              }
            }
          }
        },
        /**
         * Iterates over a NodeList, and calls _setNodeTag for each node.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param String newTagName the new tag name to use
         * @return void
         */
        _replaceNodeTags(nodeList, newTagName) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _replaceNodeTags");
          }
          for (const node of nodeList) {
            this._setNodeTag(node, newTagName);
          }
        },
        /**
         * Iterate over a NodeList, which doesn't natively fully implement the Array
         * interface.
         *
         * For convenience, the current object context is applied to the provided
         * iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return void
         */
        _forEachNode(nodeList, fn) {
          Array.prototype.forEach.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, and return the first node that passes
         * the supplied test function
         *
         * For convenience, the current object context is applied to the provided
         * test function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The test function.
         * @return void
         */
        _findNode(nodeList, fn) {
          return Array.prototype.find.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if any of the provided iterate
         * function calls returns true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _someNode(nodeList, fn) {
          return Array.prototype.some.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if all of the provided iterate
         * function calls return true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _everyNode(nodeList, fn) {
          return Array.prototype.every.call(nodeList, fn, this);
        },
        _getAllNodesWithTag(node, tagNames) {
          if (node.querySelectorAll) {
            return node.querySelectorAll(tagNames.join(","));
          }
          return [].concat.apply(
            [],
            tagNames.map(function(tag) {
              var collection = node.getElementsByTagName(tag);
              return Array.isArray(collection) ? collection : Array.from(collection);
            })
          );
        },
        /**
         * Removes the class="" attribute from every element in the given
         * subtree, except those that match CLASSES_TO_PRESERVE and
         * the classesToPreserve array from the options object.
         *
         * @param Element
         * @return void
         */
        _cleanClasses(node) {
          var classesToPreserve = this._classesToPreserve;
          var className = (node.getAttribute("class") || "").split(/\s+/).filter((cls) => classesToPreserve.includes(cls)).join(" ");
          if (className) {
            node.setAttribute("class", className);
          } else {
            node.removeAttribute("class");
          }
          for (node = node.firstElementChild; node; node = node.nextElementSibling) {
            this._cleanClasses(node);
          }
        },
        /**
         * Tests whether a string is a URL or not.
         *
         * @param {string} str The string to test
         * @return {boolean} true if str is a URL, false if not
         */
        _isUrl(str) {
          try {
            new URL(str);
            return true;
          } catch {
            return false;
          }
        },
        /**
         * Converts each <a> and <img> uri in the given element to an absolute URI,
         * ignoring #ref URIs.
         *
         * @param Element
         * @return void
         */
        _fixRelativeUris(articleContent) {
          var baseURI = this._doc.baseURI;
          var documentURI = this._doc.documentURI;
          function toAbsoluteURI(uri) {
            if (baseURI == documentURI && uri.charAt(0) == "#") {
              return uri;
            }
            try {
              return new URL(uri, baseURI).href;
            } catch (ex) {
            }
            return uri;
          }
          var links = this._getAllNodesWithTag(articleContent, ["a"]);
          this._forEachNode(links, function(link) {
            var href = link.getAttribute("href");
            if (href) {
              if (href.indexOf("javascript:") === 0) {
                if (link.childNodes.length === 1 && link.childNodes[0].nodeType === this.TEXT_NODE) {
                  var text = this._doc.createTextNode(link.textContent);
                  link.parentNode.replaceChild(text, link);
                } else {
                  var container = this._doc.createElement("span");
                  while (link.firstChild) {
                    container.appendChild(link.firstChild);
                  }
                  link.parentNode.replaceChild(container, link);
                }
              } else {
                link.setAttribute("href", toAbsoluteURI(href));
              }
            }
          });
          var medias = this._getAllNodesWithTag(articleContent, [
            "img",
            "picture",
            "figure",
            "video",
            "audio",
            "source"
          ]);
          this._forEachNode(medias, function(media) {
            var src = media.getAttribute("src");
            var poster = media.getAttribute("poster");
            var srcset = media.getAttribute("srcset");
            if (src) {
              media.setAttribute("src", toAbsoluteURI(src));
            }
            if (poster) {
              media.setAttribute("poster", toAbsoluteURI(poster));
            }
            if (srcset) {
              var newSrcset = srcset.replace(
                this.REGEXPS.srcsetUrl,
                function(_, p1, p2, p3) {
                  return toAbsoluteURI(p1) + (p2 || "") + p3;
                }
              );
              media.setAttribute("srcset", newSrcset);
            }
          });
        },
        _simplifyNestedElements(articleContent) {
          var node = articleContent;
          while (node) {
            if (node.parentNode && ["DIV", "SECTION"].includes(node.tagName) && !(node.id && node.id.startsWith("readability"))) {
              if (this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              } else if (this._hasSingleTagInsideElement(node, "DIV") || this._hasSingleTagInsideElement(node, "SECTION")) {
                var child = node.children[0];
                for (var i = 0; i < node.attributes.length; i++) {
                  child.setAttributeNode(node.attributes[i].cloneNode());
                }
                node.parentNode.replaceChild(child, node);
                node = child;
                continue;
              }
            }
            node = this._getNextNode(node);
          }
        },
        /**
         * Get the article title as an H1.
         *
         * @return string
         **/
        _getArticleTitle() {
          var doc = this._doc;
          var curTitle = "";
          var origTitle = "";
          try {
            curTitle = origTitle = doc.title.trim();
            if (typeof curTitle !== "string") {
              curTitle = origTitle = this._getInnerText(
                doc.getElementsByTagName("title")[0]
              );
            }
          } catch (e) {
          }
          var titleHadHierarchicalSeparators = false;
          function wordCount(str) {
            return str.split(/\s+/).length;
          }
          if (/ [\|\-\\\/>»] /.test(curTitle)) {
            titleHadHierarchicalSeparators = / [\\\/>»] /.test(curTitle);
            let allSeparators = Array.from(origTitle.matchAll(/ [\|\-\\\/>»] /gi));
            curTitle = origTitle.substring(0, allSeparators.pop().index);
            if (wordCount(curTitle) < 3) {
              curTitle = origTitle.replace(/^[^\|\-\\\/>»]*[\|\-\\\/>»]/gi, "");
            }
          } else if (curTitle.includes(": ")) {
            var headings = this._getAllNodesWithTag(doc, ["h1", "h2"]);
            var trimmedTitle = curTitle.trim();
            var match = this._someNode(headings, function(heading) {
              return heading.textContent.trim() === trimmedTitle;
            });
            if (!match) {
              curTitle = origTitle.substring(origTitle.lastIndexOf(":") + 1);
              if (wordCount(curTitle) < 3) {
                curTitle = origTitle.substring(origTitle.indexOf(":") + 1);
              } else if (wordCount(origTitle.substr(0, origTitle.indexOf(":"))) > 5) {
                curTitle = origTitle;
              }
            }
          } else if (curTitle.length > 150 || curTitle.length < 15) {
            var hOnes = doc.getElementsByTagName("h1");
            if (hOnes.length === 1) {
              curTitle = this._getInnerText(hOnes[0]);
            }
          }
          curTitle = curTitle.trim().replace(this.REGEXPS.normalize, " ");
          var curTitleWordCount = wordCount(curTitle);
          if (curTitleWordCount <= 4 && (!titleHadHierarchicalSeparators || curTitleWordCount != wordCount(origTitle.replace(/[\|\-\\\/>»]+/g, "")) - 1)) {
            curTitle = origTitle;
          }
          return curTitle;
        },
        /**
         * Prepare the HTML document for readability to scrape it.
         * This includes things like stripping javascript, CSS, and handling terrible markup.
         *
         * @return void
         **/
        _prepDocument() {
          var doc = this._doc;
          this._removeNodes(this._getAllNodesWithTag(doc, ["style"]));
          if (doc.body) {
            this._replaceBrs(doc.body);
          }
          this._replaceNodeTags(this._getAllNodesWithTag(doc, ["font"]), "SPAN");
        },
        /**
         * Finds the next node, starting from the given node, and ignoring
         * whitespace in between. If the given node is an element, the same node is
         * returned.
         */
        _nextNode(node) {
          var next = node;
          while (next && next.nodeType != this.ELEMENT_NODE && this.REGEXPS.whitespace.test(next.textContent)) {
            next = next.nextSibling;
          }
          return next;
        },
        /**
         * Replaces 2 or more successive <br> elements with a single <p>.
         * Whitespace between <br> elements are ignored. For example:
         *   <div>foo<br>bar<br> <br><br>abc</div>
         * will become:
         *   <div>foo<br>bar<p>abc</p></div>
         */
        _replaceBrs(elem) {
          this._forEachNode(this._getAllNodesWithTag(elem, ["br"]), function(br) {
            var next = br.nextSibling;
            var replaced = false;
            while ((next = this._nextNode(next)) && next.tagName == "BR") {
              replaced = true;
              var brSibling = next.nextSibling;
              next.remove();
              next = brSibling;
            }
            if (replaced) {
              var p = this._doc.createElement("p");
              br.parentNode.replaceChild(p, br);
              next = p.nextSibling;
              while (next) {
                if (next.tagName == "BR") {
                  var nextElem = this._nextNode(next.nextSibling);
                  if (nextElem && nextElem.tagName == "BR") {
                    break;
                  }
                }
                if (!this._isPhrasingContent(next)) {
                  break;
                }
                var sibling = next.nextSibling;
                p.appendChild(next);
                next = sibling;
              }
              while (p.lastChild && this._isWhitespace(p.lastChild)) {
                p.lastChild.remove();
              }
              if (p.parentNode.tagName === "P") {
                this._setNodeTag(p.parentNode, "DIV");
              }
            }
          });
        },
        _setNodeTag(node, tag) {
          this.log("_setNodeTag", node, tag);
          if (this._docJSDOMParser) {
            node.localName = tag.toLowerCase();
            node.tagName = tag.toUpperCase();
            return node;
          }
          var replacement = node.ownerDocument.createElement(tag);
          while (node.firstChild) {
            replacement.appendChild(node.firstChild);
          }
          node.parentNode.replaceChild(replacement, node);
          if (node.readability) {
            replacement.readability = node.readability;
          }
          for (var i = 0; i < node.attributes.length; i++) {
            replacement.setAttributeNode(node.attributes[i].cloneNode());
          }
          return replacement;
        },
        /**
         * Prepare the article node for display. Clean out any inline styles,
         * iframes, forms, strip extraneous <p> tags, etc.
         *
         * @param Element
         * @return void
         **/
        _prepArticle(articleContent) {
          this._cleanStyles(articleContent);
          this._markDataTables(articleContent);
          this._fixLazyImages(articleContent);
          this._cleanConditionally(articleContent, "form");
          this._cleanConditionally(articleContent, "fieldset");
          this._clean(articleContent, "object");
          this._clean(articleContent, "embed");
          this._clean(articleContent, "footer");
          this._clean(articleContent, "link");
          this._clean(articleContent, "aside");
          var shareElementThreshold = this.DEFAULT_CHAR_THRESHOLD;
          this._forEachNode(articleContent.children, function(topCandidate) {
            this._cleanMatchedNodes(topCandidate, function(node, matchString) {
              return this.REGEXPS.shareElements.test(matchString) && node.textContent.length < shareElementThreshold;
            });
          });
          this._clean(articleContent, "iframe");
          this._clean(articleContent, "input");
          this._clean(articleContent, "textarea");
          this._clean(articleContent, "select");
          this._clean(articleContent, "button");
          this._cleanHeaders(articleContent);
          this._cleanConditionally(articleContent, "table");
          this._cleanConditionally(articleContent, "ul");
          this._cleanConditionally(articleContent, "div");
          this._replaceNodeTags(
            this._getAllNodesWithTag(articleContent, ["h1"]),
            "h2"
          );
          this._removeNodes(
            this._getAllNodesWithTag(articleContent, ["p"]),
            function(paragraph) {
              var contentElementCount = this._getAllNodesWithTag(paragraph, [
                "img",
                "embed",
                "object",
                "iframe"
              ]).length;
              return contentElementCount === 0 && !this._getInnerText(paragraph, false);
            }
          );
          this._forEachNode(
            this._getAllNodesWithTag(articleContent, ["br"]),
            function(br) {
              var next = this._nextNode(br.nextSibling);
              if (next && next.tagName == "P") {
                br.remove();
              }
            }
          );
          this._forEachNode(
            this._getAllNodesWithTag(articleContent, ["table"]),
            function(table) {
              var tbody = this._hasSingleTagInsideElement(table, "TBODY") ? table.firstElementChild : table;
              if (this._hasSingleTagInsideElement(tbody, "TR")) {
                var row = tbody.firstElementChild;
                if (this._hasSingleTagInsideElement(row, "TD")) {
                  var cell = row.firstElementChild;
                  cell = this._setNodeTag(
                    cell,
                    this._everyNode(cell.childNodes, this._isPhrasingContent) ? "P" : "DIV"
                  );
                  table.parentNode.replaceChild(cell, table);
                }
              }
            }
          );
        },
        /**
         * Initialize a node with the readability object. Also checks the
         * className/id for special names to add to its score.
         *
         * @param Element
         * @return void
         **/
        _initializeNode(node) {
          node.readability = { contentScore: 0 };
          switch (node.tagName) {
            case "DIV":
              node.readability.contentScore += 5;
              break;
            case "PRE":
            case "TD":
            case "BLOCKQUOTE":
              node.readability.contentScore += 3;
              break;
            case "ADDRESS":
            case "OL":
            case "UL":
            case "DL":
            case "DD":
            case "DT":
            case "LI":
            case "FORM":
              node.readability.contentScore -= 3;
              break;
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "TH":
              node.readability.contentScore -= 5;
              break;
          }
          node.readability.contentScore += this._getClassWeight(node);
        },
        _removeAndGetNext(node) {
          var nextNode = this._getNextNode(node, true);
          node.remove();
          return nextNode;
        },
        /**
         * Traverse the DOM from node to node, starting at the node passed in.
         * Pass true for the second parameter to indicate this node itself
         * (and its kids) are going away, and we want the next node over.
         *
         * Calling this in a loop will traverse the DOM depth-first.
         *
         * @param {Element} node
         * @param {boolean} ignoreSelfAndKids
         * @return {Element}
         */
        _getNextNode(node, ignoreSelfAndKids) {
          if (!ignoreSelfAndKids && node.firstElementChild) {
            return node.firstElementChild;
          }
          if (node.nextElementSibling) {
            return node.nextElementSibling;
          }
          do {
            node = node.parentNode;
          } while (node && !node.nextElementSibling);
          return node && node.nextElementSibling;
        },
        // compares second text to first one
        // 1 = same text, 0 = completely different text
        // works the way that it splits both texts into words and then finds words that are unique in second text
        // the result is given by the lower length of unique parts
        _textSimilarity(textA, textB) {
          var tokensA = textA.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          var tokensB = textB.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          if (!tokensA.length || !tokensB.length) {
            return 0;
          }
          var uniqTokensB = tokensB.filter((token) => !tokensA.includes(token));
          var distanceB = uniqTokensB.join(" ").length / tokensB.join(" ").length;
          return 1 - distanceB;
        },
        /**
         * Checks whether an element node contains a valid byline
         *
         * @param node {Element}
         * @param matchString {string}
         * @return boolean
         */
        _isValidByline(node, matchString) {
          var rel = node.getAttribute("rel");
          var itemprop = node.getAttribute("itemprop");
          var bylineLength = node.textContent.trim().length;
          return (rel === "author" || itemprop && itemprop.includes("author") || this.REGEXPS.byline.test(matchString)) && !!bylineLength && bylineLength < 100;
        },
        _getNodeAncestors(node, maxDepth) {
          maxDepth = maxDepth || 0;
          var i = 0, ancestors = [];
          while (node.parentNode) {
            ancestors.push(node.parentNode);
            if (maxDepth && ++i === maxDepth) {
              break;
            }
            node = node.parentNode;
          }
          return ancestors;
        },
        /***
         * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
         *         most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
         *
         * @param page a document to run upon. Needs to be a full document, complete with body.
         * @return Element
         **/
        /* eslint-disable-next-line complexity */
        _grabArticle(page) {
          this.log("**** grabArticle ****");
          var doc = this._doc;
          var isPaging = page !== null;
          page = page ? page : this._doc.body;
          if (!page) {
            this.log("No body found in document. Abort.");
            return null;
          }
          var pageCacheHtml = page.innerHTML;
          while (true) {
            this.log("Starting grabArticle loop");
            var stripUnlikelyCandidates = this._flagIsActive(
              this.FLAG_STRIP_UNLIKELYS
            );
            var elementsToScore = [];
            var node = this._doc.documentElement;
            let shouldRemoveTitleHeader = true;
            while (node) {
              if (node.tagName === "HTML") {
                this._articleLang = node.getAttribute("lang");
              }
              var matchString = node.className + " " + node.id;
              if (!this._isProbablyVisible(node)) {
                this.log("Removing hidden node - " + matchString);
                node = this._removeAndGetNext(node);
                continue;
              }
              if (node.getAttribute("aria-modal") == "true" && node.getAttribute("role") == "dialog") {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (!this._articleByline && !this._metadata.byline && this._isValidByline(node, matchString)) {
                var endOfSearchMarkerNode = this._getNextNode(node, true);
                var next = this._getNextNode(node);
                var itemPropNameNode = null;
                while (next && next != endOfSearchMarkerNode) {
                  var itemprop = next.getAttribute("itemprop");
                  if (itemprop && itemprop.includes("name")) {
                    itemPropNameNode = next;
                    break;
                  } else {
                    next = this._getNextNode(next);
                  }
                }
                this._articleByline = (itemPropNameNode ?? node).textContent.trim();
                node = this._removeAndGetNext(node);
                continue;
              }
              if (shouldRemoveTitleHeader && this._headerDuplicatesTitle(node)) {
                this.log(
                  "Removing header: ",
                  node.textContent.trim(),
                  this._articleTitle.trim()
                );
                shouldRemoveTitleHeader = false;
                node = this._removeAndGetNext(node);
                continue;
              }
              if (stripUnlikelyCandidates) {
                if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString) && !this._hasAncestorTag(node, "table") && !this._hasAncestorTag(node, "code") && node.tagName !== "BODY" && node.tagName !== "A") {
                  this.log("Removing unlikely candidate - " + matchString);
                  node = this._removeAndGetNext(node);
                  continue;
                }
                if (this.UNLIKELY_ROLES.includes(node.getAttribute("role"))) {
                  this.log(
                    "Removing content with role " + node.getAttribute("role") + " - " + matchString
                  );
                  node = this._removeAndGetNext(node);
                  continue;
                }
              }
              if ((node.tagName === "DIV" || node.tagName === "SECTION" || node.tagName === "HEADER" || node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3" || node.tagName === "H4" || node.tagName === "H5" || node.tagName === "H6") && this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (this.DEFAULT_TAGS_TO_SCORE.includes(node.tagName)) {
                elementsToScore.push(node);
              }
              if (node.tagName === "DIV") {
                var p = null;
                var childNode = node.firstChild;
                while (childNode) {
                  var nextSibling = childNode.nextSibling;
                  if (this._isPhrasingContent(childNode)) {
                    if (p !== null) {
                      p.appendChild(childNode);
                    } else if (!this._isWhitespace(childNode)) {
                      p = doc.createElement("p");
                      node.replaceChild(p, childNode);
                      p.appendChild(childNode);
                    }
                  } else if (p !== null) {
                    while (p.lastChild && this._isWhitespace(p.lastChild)) {
                      p.lastChild.remove();
                    }
                    p = null;
                  }
                  childNode = nextSibling;
                }
                if (this._hasSingleTagInsideElement(node, "P") && this._getLinkDensity(node) < 0.25) {
                  var newNode = node.children[0];
                  node.parentNode.replaceChild(newNode, node);
                  node = newNode;
                  elementsToScore.push(node);
                } else if (!this._hasChildBlockElement(node)) {
                  node = this._setNodeTag(node, "P");
                  elementsToScore.push(node);
                }
              }
              node = this._getNextNode(node);
            }
            var candidates = [];
            this._forEachNode(elementsToScore, function(elementToScore) {
              if (!elementToScore.parentNode || typeof elementToScore.parentNode.tagName === "undefined") {
                return;
              }
              var innerText = this._getInnerText(elementToScore);
              if (innerText.length < 25) {
                return;
              }
              var ancestors2 = this._getNodeAncestors(elementToScore, 5);
              if (ancestors2.length === 0) {
                return;
              }
              var contentScore = 0;
              contentScore += 1;
              contentScore += innerText.split(this.REGEXPS.commas).length;
              contentScore += Math.min(Math.floor(innerText.length / 100), 3);
              this._forEachNode(ancestors2, function(ancestor, level) {
                if (!ancestor.tagName || !ancestor.parentNode || typeof ancestor.parentNode.tagName === "undefined") {
                  return;
                }
                if (typeof ancestor.readability === "undefined") {
                  this._initializeNode(ancestor);
                  candidates.push(ancestor);
                }
                if (level === 0) {
                  var scoreDivider = 1;
                } else if (level === 1) {
                  scoreDivider = 2;
                } else {
                  scoreDivider = level * 3;
                }
                ancestor.readability.contentScore += contentScore / scoreDivider;
              });
            });
            var topCandidates = [];
            for (var c = 0, cl = candidates.length; c < cl; c += 1) {
              var candidate = candidates[c];
              var candidateScore = candidate.readability.contentScore * (1 - this._getLinkDensity(candidate));
              candidate.readability.contentScore = candidateScore;
              this.log("Candidate:", candidate, "with score " + candidateScore);
              for (var t = 0; t < this._nbTopCandidates; t++) {
                var aTopCandidate = topCandidates[t];
                if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
                  topCandidates.splice(t, 0, candidate);
                  if (topCandidates.length > this._nbTopCandidates) {
                    topCandidates.pop();
                  }
                  break;
                }
              }
            }
            var topCandidate = topCandidates[0] || null;
            var neededToCreateTopCandidate = false;
            var parentOfTopCandidate;
            if (topCandidate === null || topCandidate.tagName === "BODY") {
              topCandidate = doc.createElement("DIV");
              neededToCreateTopCandidate = true;
              while (page.firstChild) {
                this.log("Moving child out:", page.firstChild);
                topCandidate.appendChild(page.firstChild);
              }
              page.appendChild(topCandidate);
              this._initializeNode(topCandidate);
            } else if (topCandidate) {
              var alternativeCandidateAncestors = [];
              for (var i = 1; i < topCandidates.length; i++) {
                if (topCandidates[i].readability.contentScore / topCandidate.readability.contentScore >= 0.75) {
                  alternativeCandidateAncestors.push(
                    this._getNodeAncestors(topCandidates[i])
                  );
                }
              }
              var MINIMUM_TOPCANDIDATES = 3;
              if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
                parentOfTopCandidate = topCandidate.parentNode;
                while (parentOfTopCandidate.tagName !== "BODY") {
                  var listsContainingThisAncestor = 0;
                  for (var ancestorIndex = 0; ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
                    listsContainingThisAncestor += Number(
                      alternativeCandidateAncestors[ancestorIndex].includes(
                        parentOfTopCandidate
                      )
                    );
                  }
                  if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
                    topCandidate = parentOfTopCandidate;
                    break;
                  }
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                }
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
              parentOfTopCandidate = topCandidate.parentNode;
              var lastScore = topCandidate.readability.contentScore;
              var scoreThreshold = lastScore / 3;
              while (parentOfTopCandidate.tagName !== "BODY") {
                if (!parentOfTopCandidate.readability) {
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                  continue;
                }
                var parentScore = parentOfTopCandidate.readability.contentScore;
                if (parentScore < scoreThreshold) {
                  break;
                }
                if (parentScore > lastScore) {
                  topCandidate = parentOfTopCandidate;
                  break;
                }
                lastScore = parentOfTopCandidate.readability.contentScore;
                parentOfTopCandidate = parentOfTopCandidate.parentNode;
              }
              parentOfTopCandidate = topCandidate.parentNode;
              while (parentOfTopCandidate.tagName != "BODY" && parentOfTopCandidate.children.length == 1) {
                topCandidate = parentOfTopCandidate;
                parentOfTopCandidate = topCandidate.parentNode;
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
            }
            var articleContent = doc.createElement("DIV");
            if (isPaging) {
              articleContent.id = "readability-content";
            }
            var siblingScoreThreshold = Math.max(
              10,
              topCandidate.readability.contentScore * 0.2
            );
            parentOfTopCandidate = topCandidate.parentNode;
            var siblings = parentOfTopCandidate.children;
            for (var s = 0, sl = siblings.length; s < sl; s++) {
              var sibling = siblings[s];
              var append = false;
              this.log(
                "Looking at sibling node:",
                sibling,
                sibling.readability ? "with score " + sibling.readability.contentScore : ""
              );
              this.log(
                "Sibling has score",
                sibling.readability ? sibling.readability.contentScore : "Unknown"
              );
              if (sibling === topCandidate) {
                append = true;
              } else {
                var contentBonus = 0;
                if (sibling.className === topCandidate.className && topCandidate.className !== "") {
                  contentBonus += topCandidate.readability.contentScore * 0.2;
                }
                if (sibling.readability && sibling.readability.contentScore + contentBonus >= siblingScoreThreshold) {
                  append = true;
                } else if (sibling.nodeName === "P") {
                  var linkDensity = this._getLinkDensity(sibling);
                  var nodeContent = this._getInnerText(sibling);
                  var nodeLength = nodeContent.length;
                  if (nodeLength > 80 && linkDensity < 0.25) {
                    append = true;
                  } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                    append = true;
                  }
                }
              }
              if (append) {
                this.log("Appending node:", sibling);
                if (!this.ALTER_TO_DIV_EXCEPTIONS.includes(sibling.nodeName)) {
                  this.log("Altering sibling:", sibling, "to div.");
                  sibling = this._setNodeTag(sibling, "DIV");
                }
                articleContent.appendChild(sibling);
                siblings = parentOfTopCandidate.children;
                s -= 1;
                sl -= 1;
              }
            }
            if (this._debug) {
              this.log("Article content pre-prep: " + articleContent.innerHTML);
            }
            this._prepArticle(articleContent);
            if (this._debug) {
              this.log("Article content post-prep: " + articleContent.innerHTML);
            }
            if (neededToCreateTopCandidate) {
              topCandidate.id = "readability-page-1";
              topCandidate.className = "page";
            } else {
              var div = doc.createElement("DIV");
              div.id = "readability-page-1";
              div.className = "page";
              while (articleContent.firstChild) {
                div.appendChild(articleContent.firstChild);
              }
              articleContent.appendChild(div);
            }
            if (this._debug) {
              this.log("Article content after paging: " + articleContent.innerHTML);
            }
            var parseSuccessful = true;
            var textLength = this._getInnerText(articleContent, true).length;
            if (textLength < this._charThreshold) {
              parseSuccessful = false;
              page.innerHTML = pageCacheHtml;
              this._attempts.push({
                articleContent,
                textLength
              });
              if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
                this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
              } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
                this._removeFlag(this.FLAG_WEIGHT_CLASSES);
              } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
                this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
              } else {
                this._attempts.sort(function(a, b) {
                  return b.textLength - a.textLength;
                });
                if (!this._attempts[0].textLength) {
                  return null;
                }
                articleContent = this._attempts[0].articleContent;
                parseSuccessful = true;
              }
            }
            if (parseSuccessful) {
              var ancestors = [parentOfTopCandidate, topCandidate].concat(
                this._getNodeAncestors(parentOfTopCandidate)
              );
              this._someNode(ancestors, function(ancestor) {
                if (!ancestor.tagName) {
                  return false;
                }
                var articleDir = ancestor.getAttribute("dir");
                if (articleDir) {
                  this._articleDir = articleDir;
                  return true;
                }
                return false;
              });
              return articleContent;
            }
          }
        },
        /**
         * Converts some of the common HTML entities in string to their corresponding characters.
         *
         * @param str {string} - a string to unescape.
         * @return string without HTML entity.
         */
        _unescapeHtmlEntities(str) {
          if (!str) {
            return str;
          }
          var htmlEscapeMap = this.HTML_ESCAPE_MAP;
          return str.replace(/&(quot|amp|apos|lt|gt);/g, function(_, tag) {
            return htmlEscapeMap[tag];
          }).replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, function(_, hex, numStr) {
            var num = parseInt(hex || numStr, hex ? 16 : 10);
            if (num == 0 || num > 1114111 || num >= 55296 && num <= 57343) {
              num = 65533;
            }
            return String.fromCodePoint(num);
          });
        },
        /**
         * Try to extract metadata from JSON-LD object.
         * For now, only Schema.org objects of type Article or its subtypes are supported.
         * @return Object with any metadata that could be extracted (possibly none)
         */
        _getJSONLD(doc) {
          var scripts = this._getAllNodesWithTag(doc, ["script"]);
          var metadata;
          this._forEachNode(scripts, function(jsonLdElement) {
            if (!metadata && jsonLdElement.getAttribute("type") === "application/ld+json") {
              try {
                var content = jsonLdElement.textContent.replace(
                  /^\s*<!\[CDATA\[|\]\]>\s*$/g,
                  ""
                );
                var parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  parsed = parsed.find((it) => {
                    return it["@type"] && it["@type"].match(this.REGEXPS.jsonLdArticleTypes);
                  });
                  if (!parsed) {
                    return;
                  }
                }
                var schemaDotOrgRegex = /^https?\:\/\/schema\.org\/?$/;
                var matches = typeof parsed["@context"] === "string" && parsed["@context"].match(schemaDotOrgRegex) || typeof parsed["@context"] === "object" && typeof parsed["@context"]["@vocab"] == "string" && parsed["@context"]["@vocab"].match(schemaDotOrgRegex);
                if (!matches) {
                  return;
                }
                if (!parsed["@type"] && Array.isArray(parsed["@graph"])) {
                  parsed = parsed["@graph"].find((it) => {
                    return (it["@type"] || "").match(this.REGEXPS.jsonLdArticleTypes);
                  });
                }
                if (!parsed || !parsed["@type"] || !parsed["@type"].match(this.REGEXPS.jsonLdArticleTypes)) {
                  return;
                }
                metadata = {};
                if (typeof parsed.name === "string" && typeof parsed.headline === "string" && parsed.name !== parsed.headline) {
                  var title = this._getArticleTitle();
                  var nameMatches = this._textSimilarity(parsed.name, title) > 0.75;
                  var headlineMatches = this._textSimilarity(parsed.headline, title) > 0.75;
                  if (headlineMatches && !nameMatches) {
                    metadata.title = parsed.headline;
                  } else {
                    metadata.title = parsed.name;
                  }
                } else if (typeof parsed.name === "string") {
                  metadata.title = parsed.name.trim();
                } else if (typeof parsed.headline === "string") {
                  metadata.title = parsed.headline.trim();
                }
                if (parsed.author) {
                  if (typeof parsed.author.name === "string") {
                    metadata.byline = parsed.author.name.trim();
                  } else if (Array.isArray(parsed.author) && parsed.author[0] && typeof parsed.author[0].name === "string") {
                    metadata.byline = parsed.author.filter(function(author) {
                      return author && typeof author.name === "string";
                    }).map(function(author) {
                      return author.name.trim();
                    }).join(", ");
                  }
                }
                if (typeof parsed.description === "string") {
                  metadata.excerpt = parsed.description.trim();
                }
                if (parsed.publisher && typeof parsed.publisher.name === "string") {
                  metadata.siteName = parsed.publisher.name.trim();
                }
                if (typeof parsed.datePublished === "string") {
                  metadata.datePublished = parsed.datePublished.trim();
                }
              } catch (err) {
                this.log(err.message);
              }
            }
          });
          return metadata ? metadata : {};
        },
        /**
         * Attempts to get excerpt and byline metadata for the article.
         *
         * @param {Object} jsonld — object containing any metadata that
         * could be extracted from JSON-LD object.
         *
         * @return Object with optional "excerpt" and "byline" properties
         */
        _getArticleMetadata(jsonld) {
          var metadata = {};
          var values = {};
          var metaElements = this._doc.getElementsByTagName("meta");
          var propertyPattern = /\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi;
          var namePattern = /^\s*(?:(dc|dcterm|og|twitter|parsely|weibo:(article|webpage))\s*[-\.:]\s*)?(author|creator|pub-date|description|title|site_name)\s*$/i;
          this._forEachNode(metaElements, function(element) {
            var elementName = element.getAttribute("name");
            var elementProperty = element.getAttribute("property");
            var content = element.getAttribute("content");
            if (!content) {
              return;
            }
            var matches = null;
            var name = null;
            if (elementProperty) {
              matches = elementProperty.match(propertyPattern);
              if (matches) {
                name = matches[0].toLowerCase().replace(/\s/g, "");
                values[name] = content.trim();
              }
            }
            if (!matches && elementName && namePattern.test(elementName)) {
              name = elementName;
              if (content) {
                name = name.toLowerCase().replace(/\s/g, "").replace(/\./g, ":");
                values[name] = content.trim();
              }
            }
          });
          metadata.title = jsonld.title || values["dc:title"] || values["dcterm:title"] || values["og:title"] || values["weibo:article:title"] || values["weibo:webpage:title"] || values.title || values["twitter:title"] || values["parsely-title"];
          if (!metadata.title) {
            metadata.title = this._getArticleTitle();
          }
          const articleAuthor = typeof values["article:author"] === "string" && !this._isUrl(values["article:author"]) ? values["article:author"] : void 0;
          metadata.byline = jsonld.byline || values["dc:creator"] || values["dcterm:creator"] || values.author || values["parsely-author"] || articleAuthor;
          metadata.excerpt = jsonld.excerpt || values["dc:description"] || values["dcterm:description"] || values["og:description"] || values["weibo:article:description"] || values["weibo:webpage:description"] || values.description || values["twitter:description"];
          metadata.siteName = jsonld.siteName || values["og:site_name"];
          metadata.publishedTime = jsonld.datePublished || values["article:published_time"] || values["parsely-pub-date"] || null;
          metadata.title = this._unescapeHtmlEntities(metadata.title);
          metadata.byline = this._unescapeHtmlEntities(metadata.byline);
          metadata.excerpt = this._unescapeHtmlEntities(metadata.excerpt);
          metadata.siteName = this._unescapeHtmlEntities(metadata.siteName);
          metadata.publishedTime = this._unescapeHtmlEntities(metadata.publishedTime);
          return metadata;
        },
        /**
         * Check if node is image, or if node contains exactly only one image
         * whether as a direct child or as its descendants.
         *
         * @param Element
         **/
        _isSingleImage(node) {
          while (node) {
            if (node.tagName === "IMG") {
              return true;
            }
            if (node.children.length !== 1 || node.textContent.trim() !== "") {
              return false;
            }
            node = node.children[0];
          }
          return false;
        },
        /**
         * Find all <noscript> that are located after <img> nodes, and which contain only one
         * <img> element. Replace the first image with the image from inside the <noscript> tag,
         * and remove the <noscript> tag. This improves the quality of the images we use on
         * some sites (e.g. Medium).
         *
         * @param Element
         **/
        _unwrapNoscriptImages(doc) {
          var imgs = Array.from(doc.getElementsByTagName("img"));
          this._forEachNode(imgs, function(img) {
            for (var i = 0; i < img.attributes.length; i++) {
              var attr = img.attributes[i];
              switch (attr.name) {
                case "src":
                case "srcset":
                case "data-src":
                case "data-srcset":
                  return;
              }
              if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                return;
              }
            }
            img.remove();
          });
          var noscripts = Array.from(doc.getElementsByTagName("noscript"));
          this._forEachNode(noscripts, function(noscript) {
            if (!this._isSingleImage(noscript)) {
              return;
            }
            var tmp = doc.createElement("div");
            tmp.innerHTML = noscript.innerHTML;
            var prevElement = noscript.previousElementSibling;
            if (prevElement && this._isSingleImage(prevElement)) {
              var prevImg = prevElement;
              if (prevImg.tagName !== "IMG") {
                prevImg = prevElement.getElementsByTagName("img")[0];
              }
              var newImg = tmp.getElementsByTagName("img")[0];
              for (var i = 0; i < prevImg.attributes.length; i++) {
                var attr = prevImg.attributes[i];
                if (attr.value === "") {
                  continue;
                }
                if (attr.name === "src" || attr.name === "srcset" || /\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                  if (newImg.getAttribute(attr.name) === attr.value) {
                    continue;
                  }
                  var attrName = attr.name;
                  if (newImg.hasAttribute(attrName)) {
                    attrName = "data-old-" + attrName;
                  }
                  newImg.setAttribute(attrName, attr.value);
                }
              }
              noscript.parentNode.replaceChild(tmp.firstElementChild, prevElement);
            }
          });
        },
        /**
         * Removes script tags from the document.
         *
         * @param Element
         **/
        _removeScripts(doc) {
          this._removeNodes(this._getAllNodesWithTag(doc, ["script", "noscript"]));
        },
        /**
         * Check if this node has only whitespace and a single element with given tag
         * Returns false if the DIV node contains non-empty text nodes
         * or if it contains no element with given tag or more than 1 element.
         *
         * @param Element
         * @param string tag of child element
         **/
        _hasSingleTagInsideElement(element, tag) {
          if (element.children.length != 1 || element.children[0].tagName !== tag) {
            return false;
          }
          return !this._someNode(element.childNodes, function(node) {
            return node.nodeType === this.TEXT_NODE && this.REGEXPS.hasContent.test(node.textContent);
          });
        },
        _isElementWithoutContent(node) {
          return node.nodeType === this.ELEMENT_NODE && !node.textContent.trim().length && (!node.children.length || node.children.length == node.getElementsByTagName("br").length + node.getElementsByTagName("hr").length);
        },
        /**
         * Determine whether element has any children block level elements.
         *
         * @param Element
         */
        _hasChildBlockElement(element) {
          return this._someNode(element.childNodes, function(node) {
            return this.DIV_TO_P_ELEMS.has(node.tagName) || this._hasChildBlockElement(node);
          });
        },
        /***
         * Determine if a node qualifies as phrasing content.
         * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
         **/
        _isPhrasingContent(node) {
          return node.nodeType === this.TEXT_NODE || this.PHRASING_ELEMS.includes(node.tagName) || (node.tagName === "A" || node.tagName === "DEL" || node.tagName === "INS") && this._everyNode(node.childNodes, this._isPhrasingContent);
        },
        _isWhitespace(node) {
          return node.nodeType === this.TEXT_NODE && node.textContent.trim().length === 0 || node.nodeType === this.ELEMENT_NODE && node.tagName === "BR";
        },
        /**
         * Get the inner text of a node - cross browser compatibly.
         * This also strips out any excess whitespace to be found.
         *
         * @param Element
         * @param Boolean normalizeSpaces (default: true)
         * @return string
         **/
        _getInnerText(e, normalizeSpaces) {
          normalizeSpaces = typeof normalizeSpaces === "undefined" ? true : normalizeSpaces;
          var textContent = e.textContent.trim();
          if (normalizeSpaces) {
            return textContent.replace(this.REGEXPS.normalize, " ");
          }
          return textContent;
        },
        /**
         * Get the number of times a string s appears in the node e.
         *
         * @param Element
         * @param string - what to split on. Default is ","
         * @return number (integer)
         **/
        _getCharCount(e, s) {
          s = s || ",";
          return this._getInnerText(e).split(s).length - 1;
        },
        /**
         * Remove the style attribute on every e and under.
         * TODO: Test if getElementsByTagName(*) is faster.
         *
         * @param Element
         * @return void
         **/
        _cleanStyles(e) {
          if (!e || e.tagName.toLowerCase() === "svg") {
            return;
          }
          for (var i = 0; i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
            e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
          }
          if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)) {
            e.removeAttribute("width");
            e.removeAttribute("height");
          }
          var cur = e.firstElementChild;
          while (cur !== null) {
            this._cleanStyles(cur);
            cur = cur.nextElementSibling;
          }
        },
        /**
         * Get the density of links as a percentage of the content
         * This is the amount of text that is inside a link divided by the total text in the node.
         *
         * @param Element
         * @return number (float)
         **/
        _getLinkDensity(element) {
          var textLength = this._getInnerText(element).length;
          if (textLength === 0) {
            return 0;
          }
          var linkLength = 0;
          this._forEachNode(element.getElementsByTagName("a"), function(linkNode) {
            var href = linkNode.getAttribute("href");
            var coefficient = href && this.REGEXPS.hashUrl.test(href) ? 0.3 : 1;
            linkLength += this._getInnerText(linkNode).length * coefficient;
          });
          return linkLength / textLength;
        },
        /**
         * Get an elements class/id weight. Uses regular expressions to tell if this
         * element looks good or bad.
         *
         * @param Element
         * @return number (Integer)
         **/
        _getClassWeight(e) {
          if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
            return 0;
          }
          var weight = 0;
          if (typeof e.className === "string" && e.className !== "") {
            if (this.REGEXPS.negative.test(e.className)) {
              weight -= 25;
            }
            if (this.REGEXPS.positive.test(e.className)) {
              weight += 25;
            }
          }
          if (typeof e.id === "string" && e.id !== "") {
            if (this.REGEXPS.negative.test(e.id)) {
              weight -= 25;
            }
            if (this.REGEXPS.positive.test(e.id)) {
              weight += 25;
            }
          }
          return weight;
        },
        /**
         * Clean a node of all elements of type "tag".
         * (Unless it's a youtube/vimeo video. People love movies.)
         *
         * @param Element
         * @param string tag to clean
         * @return void
         **/
        _clean(e, tag) {
          var isEmbed = ["object", "embed", "iframe"].includes(tag);
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(element) {
            if (isEmbed) {
              for (var i = 0; i < element.attributes.length; i++) {
                if (this._allowedVideoRegex.test(element.attributes[i].value)) {
                  return false;
                }
              }
              if (element.tagName === "object" && this._allowedVideoRegex.test(element.innerHTML)) {
                return false;
              }
            }
            return true;
          });
        },
        /**
         * Check if a given node has one of its ancestor tag name matching the
         * provided one.
         * @param  HTMLElement node
         * @param  String      tagName
         * @param  Number      maxDepth
         * @param  Function    filterFn a filter to invoke to determine whether this node 'counts'
         * @return Boolean
         */
        _hasAncestorTag(node, tagName, maxDepth, filterFn) {
          maxDepth = maxDepth || 3;
          tagName = tagName.toUpperCase();
          var depth = 0;
          while (node.parentNode) {
            if (maxDepth > 0 && depth > maxDepth) {
              return false;
            }
            if (node.parentNode.tagName === tagName && (!filterFn || filterFn(node.parentNode))) {
              return true;
            }
            node = node.parentNode;
            depth++;
          }
          return false;
        },
        /**
         * Return an object indicating how many rows and columns this table has.
         */
        _getRowAndColumnCount(table) {
          var rows = 0;
          var columns = 0;
          var trs = table.getElementsByTagName("tr");
          for (var i = 0; i < trs.length; i++) {
            var rowspan = trs[i].getAttribute("rowspan") || 0;
            if (rowspan) {
              rowspan = parseInt(rowspan, 10);
            }
            rows += rowspan || 1;
            var columnsInThisRow = 0;
            var cells = trs[i].getElementsByTagName("td");
            for (var j = 0; j < cells.length; j++) {
              var colspan = cells[j].getAttribute("colspan") || 0;
              if (colspan) {
                colspan = parseInt(colspan, 10);
              }
              columnsInThisRow += colspan || 1;
            }
            columns = Math.max(columns, columnsInThisRow);
          }
          return { rows, columns };
        },
        /**
         * Look for 'data' (as opposed to 'layout') tables, for which we use
         * similar checks as
         * https://searchfox.org/mozilla-central/rev/f82d5c549f046cb64ce5602bfd894b7ae807c8f8/accessible/generic/TableAccessible.cpp#19
         */
        _markDataTables(root) {
          var tables = root.getElementsByTagName("table");
          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var role = table.getAttribute("role");
            if (role == "presentation") {
              table._readabilityDataTable = false;
              continue;
            }
            var datatable = table.getAttribute("datatable");
            if (datatable == "0") {
              table._readabilityDataTable = false;
              continue;
            }
            var summary = table.getAttribute("summary");
            if (summary) {
              table._readabilityDataTable = true;
              continue;
            }
            var caption = table.getElementsByTagName("caption")[0];
            if (caption && caption.childNodes.length) {
              table._readabilityDataTable = true;
              continue;
            }
            var dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
            var descendantExists = function(tag) {
              return !!table.getElementsByTagName(tag)[0];
            };
            if (dataTableDescendants.some(descendantExists)) {
              this.log("Data table because found data-y descendant");
              table._readabilityDataTable = true;
              continue;
            }
            if (table.getElementsByTagName("table")[0]) {
              table._readabilityDataTable = false;
              continue;
            }
            var sizeInfo = this._getRowAndColumnCount(table);
            if (sizeInfo.columns == 1 || sizeInfo.rows == 1) {
              table._readabilityDataTable = false;
              continue;
            }
            if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
              table._readabilityDataTable = true;
              continue;
            }
            table._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
          }
        },
        /* convert images and figures that have properties like data-src into images that can be loaded without JS */
        _fixLazyImages(root) {
          this._forEachNode(
            this._getAllNodesWithTag(root, ["img", "picture", "figure"]),
            function(elem) {
              if (elem.src && this.REGEXPS.b64DataUrl.test(elem.src)) {
                var parts = this.REGEXPS.b64DataUrl.exec(elem.src);
                if (parts[1] === "image/svg+xml") {
                  return;
                }
                var srcCouldBeRemoved = false;
                for (var i = 0; i < elem.attributes.length; i++) {
                  var attr = elem.attributes[i];
                  if (attr.name === "src") {
                    continue;
                  }
                  if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                    srcCouldBeRemoved = true;
                    break;
                  }
                }
                if (srcCouldBeRemoved) {
                  var b64starts = parts[0].length;
                  var b64length = elem.src.length - b64starts;
                  if (b64length < 133) {
                    elem.removeAttribute("src");
                  }
                }
              }
              if ((elem.src || elem.srcset && elem.srcset != "null") && !elem.className.toLowerCase().includes("lazy")) {
                return;
              }
              for (var j = 0; j < elem.attributes.length; j++) {
                attr = elem.attributes[j];
                if (attr.name === "src" || attr.name === "srcset" || attr.name === "alt") {
                  continue;
                }
                var copyTo = null;
                if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
                  copyTo = "srcset";
                } else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
                  copyTo = "src";
                }
                if (copyTo) {
                  if (elem.tagName === "IMG" || elem.tagName === "PICTURE") {
                    elem.setAttribute(copyTo, attr.value);
                  } else if (elem.tagName === "FIGURE" && !this._getAllNodesWithTag(elem, ["img", "picture"]).length) {
                    var img = this._doc.createElement("img");
                    img.setAttribute(copyTo, attr.value);
                    elem.appendChild(img);
                  }
                }
              }
            }
          );
        },
        _getTextDensity(e, tags) {
          var textLength = this._getInnerText(e, true).length;
          if (textLength === 0) {
            return 0;
          }
          var childrenLength = 0;
          var children = this._getAllNodesWithTag(e, tags);
          this._forEachNode(
            children,
            (child) => childrenLength += this._getInnerText(child, true).length
          );
          return childrenLength / textLength;
        },
        /**
         * Clean an element of all tags of type "tag" if they look fishy.
         * "Fishy" is an algorithm based on content length, classnames, link density, number of images & embeds, etc.
         *
         * @return void
         **/
        _cleanConditionally(e, tag) {
          if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
            return;
          }
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(node) {
            var isDataTable = function(t) {
              return t._readabilityDataTable;
            };
            var isList = tag === "ul" || tag === "ol";
            if (!isList) {
              var listLength = 0;
              var listNodes = this._getAllNodesWithTag(node, ["ul", "ol"]);
              this._forEachNode(
                listNodes,
                (list) => listLength += this._getInnerText(list).length
              );
              isList = listLength / this._getInnerText(node).length > 0.9;
            }
            if (tag === "table" && isDataTable(node)) {
              return false;
            }
            if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
              return false;
            }
            if (this._hasAncestorTag(node, "code")) {
              return false;
            }
            if ([...node.getElementsByTagName("table")].some(
              (tbl) => tbl._readabilityDataTable
            )) {
              return false;
            }
            var weight = this._getClassWeight(node);
            this.log("Cleaning Conditionally", node);
            var contentScore = 0;
            if (weight + contentScore < 0) {
              return true;
            }
            if (this._getCharCount(node, ",") < 10) {
              var p = node.getElementsByTagName("p").length;
              var img = node.getElementsByTagName("img").length;
              var li = node.getElementsByTagName("li").length - 100;
              var input = node.getElementsByTagName("input").length;
              var headingDensity = this._getTextDensity(node, [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6"
              ]);
              var embedCount = 0;
              var embeds = this._getAllNodesWithTag(node, [
                "object",
                "embed",
                "iframe"
              ]);
              for (var i = 0; i < embeds.length; i++) {
                for (var j = 0; j < embeds[i].attributes.length; j++) {
                  if (this._allowedVideoRegex.test(embeds[i].attributes[j].value)) {
                    return false;
                  }
                }
                if (embeds[i].tagName === "object" && this._allowedVideoRegex.test(embeds[i].innerHTML)) {
                  return false;
                }
                embedCount++;
              }
              var innerText = this._getInnerText(node);
              if (this.REGEXPS.adWords.test(innerText) || this.REGEXPS.loadingWords.test(innerText)) {
                return true;
              }
              var contentLength = innerText.length;
              var linkDensity = this._getLinkDensity(node);
              var textishTags = ["SPAN", "LI", "TD"].concat(
                Array.from(this.DIV_TO_P_ELEMS)
              );
              var textDensity = this._getTextDensity(node, textishTags);
              var isFigureChild = this._hasAncestorTag(node, "figure");
              const shouldRemoveNode = () => {
                const errs = [];
                if (!isFigureChild && img > 1 && p / img < 0.5) {
                  errs.push(`Bad p to img ratio (img=${img}, p=${p})`);
                }
                if (!isList && li > p) {
                  errs.push(`Too many li's outside of a list. (li=${li} > p=${p})`);
                }
                if (input > Math.floor(p / 3)) {
                  errs.push(`Too many inputs per p. (input=${input}, p=${p})`);
                }
                if (!isList && !isFigureChild && headingDensity < 0.9 && contentLength < 25 && (img === 0 || img > 2) && linkDensity > 0) {
                  errs.push(
                    `Suspiciously short. (headingDensity=${headingDensity}, img=${img}, linkDensity=${linkDensity})`
                  );
                }
                if (!isList && weight < 25 && linkDensity > 0.2 + this._linkDensityModifier) {
                  errs.push(
                    `Low weight and a little linky. (linkDensity=${linkDensity})`
                  );
                }
                if (weight >= 25 && linkDensity > 0.5 + this._linkDensityModifier) {
                  errs.push(
                    `High weight and mostly links. (linkDensity=${linkDensity})`
                  );
                }
                if (embedCount === 1 && contentLength < 75 || embedCount > 1) {
                  errs.push(
                    `Suspicious embed. (embedCount=${embedCount}, contentLength=${contentLength})`
                  );
                }
                if (img === 0 && textDensity === 0) {
                  errs.push(
                    `No useful content. (img=${img}, textDensity=${textDensity})`
                  );
                }
                if (errs.length) {
                  this.log("Checks failed", errs);
                  return true;
                }
                return false;
              };
              var haveToRemove = shouldRemoveNode();
              if (isList && haveToRemove) {
                for (var x = 0; x < node.children.length; x++) {
                  let child = node.children[x];
                  if (child.children.length > 1) {
                    return haveToRemove;
                  }
                }
                let li_count = node.getElementsByTagName("li").length;
                if (img == li_count) {
                  return false;
                }
              }
              return haveToRemove;
            }
            return false;
          });
        },
        /**
         * Clean out elements that match the specified conditions
         *
         * @param Element
         * @param Function determines whether a node should be removed
         * @return void
         **/
        _cleanMatchedNodes(e, filter) {
          var endOfSearchMarkerNode = this._getNextNode(e, true);
          var next = this._getNextNode(e);
          while (next && next != endOfSearchMarkerNode) {
            if (filter.call(this, next, next.className + " " + next.id)) {
              next = this._removeAndGetNext(next);
            } else {
              next = this._getNextNode(next);
            }
          }
        },
        /**
         * Clean out spurious headers from an Element.
         *
         * @param Element
         * @return void
         **/
        _cleanHeaders(e) {
          let headingNodes = this._getAllNodesWithTag(e, ["h1", "h2"]);
          this._removeNodes(headingNodes, function(node) {
            let shouldRemove = this._getClassWeight(node) < 0;
            if (shouldRemove) {
              this.log("Removing header with low class weight:", node);
            }
            return shouldRemove;
          });
        },
        /**
         * Check if this node is an H1 or H2 element whose content is mostly
         * the same as the article title.
         *
         * @param Element  the node to check.
         * @return boolean indicating whether this is a title-like header.
         */
        _headerDuplicatesTitle(node) {
          if (node.tagName != "H1" && node.tagName != "H2") {
            return false;
          }
          var heading = this._getInnerText(node, false);
          this.log("Evaluating similarity of header:", heading, this._articleTitle);
          return this._textSimilarity(this._articleTitle, heading) > 0.75;
        },
        _flagIsActive(flag) {
          return (this._flags & flag) > 0;
        },
        _removeFlag(flag) {
          this._flags = this._flags & ~flag;
        },
        _isProbablyVisible(node) {
          return (!node.style || node.style.display != "none") && (!node.style || node.style.visibility != "hidden") && !node.hasAttribute("hidden") && //check for "fallback-image" so that wikimedia math images are displayed
          (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
        },
        /**
         * Runs readability.
         *
         * Workflow:
         *  1. Prep the document by removing script tags, css, etc.
         *  2. Build readability's DOM tree.
         *  3. Grab the article content from the current dom tree.
         *  4. Replace the current DOM tree with the new one.
         *  5. Read peacefully.
         *
         * @return void
         **/
        parse() {
          if (this._maxElemsToParse > 0) {
            var numTags = this._doc.getElementsByTagName("*").length;
            if (numTags > this._maxElemsToParse) {
              throw new Error(
                "Aborting parsing document; " + numTags + " elements found"
              );
            }
          }
          this._unwrapNoscriptImages(this._doc);
          var jsonLd = this._disableJSONLD ? {} : this._getJSONLD(this._doc);
          this._removeScripts(this._doc);
          this._prepDocument();
          var metadata = this._getArticleMetadata(jsonLd);
          this._metadata = metadata;
          this._articleTitle = metadata.title;
          var articleContent = this._grabArticle();
          if (!articleContent) {
            return null;
          }
          this.log("Grabbed: " + articleContent.innerHTML);
          this._postProcessContent(articleContent);
          if (!metadata.excerpt) {
            var paragraphs = articleContent.getElementsByTagName("p");
            if (paragraphs.length) {
              metadata.excerpt = paragraphs[0].textContent.trim();
            }
          }
          var textContent = articleContent.textContent;
          return {
            title: this._articleTitle,
            byline: metadata.byline || this._articleByline,
            dir: this._articleDir,
            lang: this._articleLang,
            content: this._serializer(articleContent),
            textContent,
            length: textContent.length,
            excerpt: metadata.excerpt,
            siteName: metadata.siteName || this._articleSiteName,
            publishedTime: metadata.publishedTime
          };
        }
      };
      if (typeof module === "object") {
        module.exports = Readability2;
      }
    }
  });

  // node_modules/@mozilla/readability/Readability-readerable.js
  var require_Readability_readerable = __commonJS({
    "node_modules/@mozilla/readability/Readability-readerable.js"(exports, module) {
      var REGEXPS = {
        // NOTE: These two regular expressions are duplicated in
        // Readability.js. Please keep both copies in sync.
        unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
        okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i
      };
      function isNodeVisible(node) {
        return (!node.style || node.style.display != "none") && !node.hasAttribute("hidden") && //check for "fallback-image" so that wikimedia math images are displayed
        (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
      }
      function isProbablyReaderable(doc, options = {}) {
        if (typeof options == "function") {
          options = { visibilityChecker: options };
        }
        var defaultOptions = {
          minScore: 20,
          minContentLength: 140,
          visibilityChecker: isNodeVisible
        };
        options = Object.assign(defaultOptions, options);
        var nodes = doc.querySelectorAll("p, pre, article");
        var brNodes = doc.querySelectorAll("div > br");
        if (brNodes.length) {
          var set = new Set(nodes);
          [].forEach.call(brNodes, function(node) {
            set.add(node.parentNode);
          });
          nodes = Array.from(set);
        }
        var score = 0;
        return [].some.call(nodes, function(node) {
          if (!options.visibilityChecker(node)) {
            return false;
          }
          var matchString = node.className + " " + node.id;
          if (REGEXPS.unlikelyCandidates.test(matchString) && !REGEXPS.okMaybeItsACandidate.test(matchString)) {
            return false;
          }
          if (node.matches("li p")) {
            return false;
          }
          var textContentLength = node.textContent.trim().length;
          if (textContentLength < options.minContentLength) {
            return false;
          }
          score += Math.sqrt(textContentLength - options.minContentLength);
          if (score > options.minScore) {
            return true;
          }
          return false;
        });
      }
      if (typeof module === "object") {
        module.exports = isProbablyReaderable;
      }
    }
  });

  // node_modules/@mozilla/readability/index.js
  var require_readability = __commonJS({
    "node_modules/@mozilla/readability/index.js"(exports, module) {
      var Readability2 = require_Readability();
      var isProbablyReaderable = require_Readability_readerable();
      module.exports = {
        Readability: Readability2,
        isProbablyReaderable
      };
    }
  });

  // content/textExtraction.js
  var import_readability = __toESM(require_readability());

  // content/utils.js
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  // content/textExtraction.js
  function splitLargeParagraph(paragraph) {
    const MAX_CHARS = 500;
    const MAX_SENTENCES = 4;
    const segmenter = new Intl.Segmenter(
      navigator.language || "en",
      {
        granularity: "sentence"
      }
    );
    const sentences = [...segmenter.segment(paragraph)].map((part) => part.segment.trim()).filter(Boolean);
    const chunks = [];
    let currentChunk = "";
    let currentSentenceCount = 0;
    for (const sentence of sentences) {
      const wouldExceedChars = currentChunk.length + sentence.length > MAX_CHARS;
      const wouldExceedSentenceCount = currentSentenceCount >= MAX_SENTENCES;
      if (currentChunk && (wouldExceedChars || wouldExceedSentenceCount)) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentSentenceCount = 1;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
        currentSentenceCount++;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
  function cleanParagraph(text) {
    return text.replace(/\u00A0/g, " ").replace(/\s+/g, " ").replace(/\[\d+\]/g, "").trim();
  }
  function isJunkParagraph(text) {
    if (!text) return true;
    if (text.length < 15) return true;
    if (/^(subscribe|sign up|register|log in|login|get started|share)$/i.test(
      text
    )) {
      return true;
    }
    if (/^[0-9\s.,\-()%:]+$/.test(text)) {
      return true;
    }
    return false;
  }
  function cleanupWikipedia(paragraphs) {
    const result = [];
    for (const p of paragraphs) {
      if (/^(references|external links|see also|notes)$/i.test(
        p.trim()
      )) {
        break;
      }
      result.push(
        p.replace(/\(born.*?\)/gi, "").replace(/\(died.*?\)/gi, "").trim()
      );
    }
    return result;
  }
  function cleanupGutenberg(text) {
    let cleaned = text;
    const start = cleaned.match(
      /START OF THE PROJECT GUTENBERG EBOOK/i
    );
    if (start) {
      cleaned = cleaned.slice(
        start.index + start[0].length
      );
    }
    cleaned = cleaned.replace(
      /END OF THE PROJECT GUTENBERG EBOOK[\s\S]+$/i,
      ""
    );
    cleaned = cleaned.replace(
      /Project Gutenberg License[\s\S]+?www\.gutenberg\.org/gi,
      ""
    );
    return cleaned;
  }
  function extractParagraphs() {
    try {
      const documentClone = document.cloneNode(true);
      documentClone.querySelectorAll(
        "#reader-area-bar, #extension-box"
      ).forEach((el) => el.remove());
      const article = new import_readability.Readability(documentClone).parse();
      if (!article?.content) {
        console.warn("[READER] Readability failed, falling back.");
        const fallbackParagraphs = [...$$(
          "article p, main p, p"
        )].map((el) => cleanParagraph(el.textContent)).filter((p) => !isJunkParagraph(p));
        return fallbackParagraphs;
      }
      console.log(
        "[READER] Readability Title:",
        article.title
      );
      console.log(
        "[READER] Article Length:",
        article.textContent?.length
      );
      const container = document.createElement("div");
      container.innerHTML = article.content;
      let paragraphs = [
        ...container.querySelectorAll(
          "p, blockquote"
        )
      ].map((el) => cleanParagraph(el.textContent)).filter((p) => !isJunkParagraph(p));
      if (location.hostname.includes("wikipedia.org")) {
        paragraphs = cleanupWikipedia(paragraphs);
      }
      const finalParagraphs = [];
      paragraphs.forEach((paragraph) => {
        const split = splitLargeParagraph(paragraph);
        finalParagraphs.push(...split);
      });
      console.log(
        `[READER] Extracted ${finalParagraphs.length} paragraph chunks`
      );
      return finalParagraphs;
    } catch (error) {
      console.error(
        "[READER] Paragraph extraction failed:",
        error
      );
      return [];
    }
  }
  function extractAllText() {
    let paragraphs = extractParagraphs();
    let text = paragraphs.join("\n\n");
    if (location.hostname.includes(
      "gutenberg.org"
    )) {
      text = cleanupGutenberg(text);
    }
    return text.trim();
  }

  // content/sentenceProcessing.js
  function segmentSentences(text) {
    if (!text?.trim()) return [];
    const segmenter = new Intl.Segmenter(
      navigator.language || "en",
      {
        granularity: "sentence"
      }
    );
    return [...segmenter.segment(text)].map((part) => part.segment.trim()).filter(Boolean);
  }
  function cleanSentence(sentence) {
    return sentence.replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim();
  }
  function isJunkSentence(sentence) {
    const text = sentence.trim();
    if (text.length < 3) return true;
    if (/^(subscribe|sign up|log in|login|register|get started|skip to content)$/i.test(
      text
    )) {
      return true;
    }
    if (/^[0-9\s.,\-:()%]+$/.test(text)) {
      return true;
    }
    return false;
  }
  function extractSentences() {
    const text = extractAllText();
    if (!text) {
      console.warn("[READER] No text extracted.");
      return [];
    }
    const sentences = segmentSentences(text).map(cleanSentence).filter((sentence) => !isJunkSentence(sentence));
    console.log(
      `[READER] Extracted ${sentences.length} sentences`
    );
    return sentences;
  }
  function extractSentencesFromText(text) {
    if (!text?.trim()) return [];
    return segmentSentences(text).map(cleanSentence).filter((sentence) => !isJunkSentence(sentence));
  }

  // content/state.js
  var state = {
    allSentences: [],
    pageIndexMap: [],
    currentPage: 0,
    // Time tracking
    // Reader timing (used for active reading detection)
    timeStarted: null,
    timeSpentMs: 0,
    lastInteraction: Date.now(),
    idleIntervalId: null,
    // Session tracking
    sessionStartedAt: null,
    totalSessionTime: 0,
    pausedAt: null,
    isPaused: false,
    totalPausedMs: 0,
    sessionStartPercent: 0,
    sessionXp: 0,
    levelAtStart: 1,
    // Reading stats
    articleTitle: "",
    articleUrl: "",
    articleWordCount: 0,
    // total words in article
    currentPageWords: 0,
    // words in visible page
    currentPageChars: 0,
    // current page character count
    wordsReadSoFar: 0,
    // accumulated words read
    percentComplete: 0,
    sessionStatus: "active",
    topicId: null,
    sessionCategory: "Reading",
    sessionTags: [],
    sessionNotes: [],
    // Reader progress
    paragraphSwitches: 0,
    // Track which paragraphs have already given XP
    pageXpmap: /* @__PURE__ */ new Set(),
    completedPages: /* @__PURE__ */ new Set(),
    // Leveling system
    level: 1,
    xp: 0,
    required: 0,
    // Coin system
    coins: 15,
    // current balance + start with 15
    totalCoinsEarned: 0,
    // lifetime earned
    totalCoinsSpent: 0,
    // lifetime spent
    coinsAtStart: 0,
    // balance when session began
    sessionCoinsGained: 0,
    // ALL session rewards combined
    sessionLevelCoins: 0,
    // from leveling
    sessionReadingCoins: 0,
    // from article progress
    // The actual slice of sentences being displayed
    currentChunk: [],
    // Index of the first sentence in the current chunk
    activeElement: null,
    // cacheing prevents recalculating density and difficulty every time the user switches pages.
    paragraphCache: /* @__PURE__ */ new Map(),
    readerSettings: {
      font: "sans-serif",
      fontSize: "16px",
      bionic: false,
      theme: "theme-dark"
    }
  };

  // content/sessions.js
  function buildReadingSession(state2) {
    return {
      id: crypto.randomUUID(),
      title: document.title,
      url: window.location.href,
      startedAt: state2.sessionStartedAt,
      endedAt: Date.now(),
      totalTimeMs: state2.totalSessionTime,
      articleWords: state2.articleWordCount || 0,
      wordsRead: state2.wordsReadSoFar,
      currentPage: state2.currentPage,
      percentComplete: state2.percentComplete,
      pageCount: state2.pageIndexMap.length,
      completedPages: [...state2.completedPages || []],
      xpGained: state2.sessionXp || 0,
      totalXp: state2.xp,
      coinsGained: state2.sessionCoinsGained,
      coinBreakdown: {
        readingCoins: state2.sessionReadingCoins,
        levelCoins: state2.sessionLevelCoins,
        totalCoins: state2.sessionCoinsGained
      },
      coinsAtStart: state2.coinsAtStart,
      coinsAtEnd: state2.coins,
      levelAtStart: state2.levelAtStart,
      levelAtEnd: state2.level,
      paragraphsRead: state2.paragraphSwitches,
      status: state2.sessionStatus || "completed",
      sessionCount: 1,
      topicId: state2.topicId || null,
      topicName: state2.sessionCategory || null,
      tags: [...state2.sessionTags || []],
      notes: [...state2.sessionNotes || []],
      history: [],
      createdAt: Date.now(),
      lastReadAt: Date.now()
    };
  }
  function saveReadingSession(session) {
    chrome.storage.sync.get(["history"], (data) => {
      const history = data.history || [];
      const MAX_HISTORY = 100;
      console.log("session: ", session, session.url);
      const existingIndex = history.findIndex(
        (item) => item.url === session.url
      );
      console.log("matches: ", existingIndex);
      let currentSession;
      if (existingIndex !== -1) {
        currentSession = history.splice(existingIndex, 1)[0];
        history.unshift(currentSession);
        if (session.isCheckpoint) {
          currentSession.wordsRead = session.wordsRead;
          currentSession.totalTimeMs = session.totalTimeMs;
          currentSession.xpGained = currentSession.xpGained || 0;
          currentSession.coinsGained = session.coinsGained;
          currentSession.completedPages = [...session.completedPages || []];
          currentSession.pageCount = session.pageCount || currentSession.pageCount;
          currentSession.percentComplete = session.percentComplete;
          currentSession.currentPage = session.currentPage;
          currentSession.lastReadAt = session.endedAt;
          currentSession.endedAt = session.endedAt;
          currentSession.status = session.status;
        } else {
          currentSession.wordsRead = (currentSession.wordsRead || 0) + (session.wordsRead || 0);
          currentSession.totalTimeMs = (currentSession.totalTimeMs || 0) + (session.totalTimeMs || 0);
          currentSession.xpGained = (currentSession.xpGained || 0) + (session.xpGained || 0);
          currentSession.coinsGained = (currentSession.coinsGained || 0) + (session.coinsGained || 0);
          currentSession.completedPages = [.../* @__PURE__ */ new Set([
            ...currentSession.completedPages || [],
            ...session.completedPages || []
          ])];
          currentSession.pageCount = session.pageCount || currentSession.pageCount;
          const totalPages = currentSession.pageCount || session.pageCount || currentSession.completedPages.length;
          currentSession.percentComplete = Math.round(
            currentSession.completedPages.length / totalPages * 100
          );
          currentSession.currentPage = session.currentPage;
          currentSession.sessionCount = (currentSession.sessionCount || 1) + 1;
          currentSession.lastReadAt = session.endedAt;
          currentSession.endedAt = session.endedAt;
          currentSession.status = currentSession.percentComplete >= 100 ? "completed" : session.status;
        }
      } else {
        currentSession = session;
        history.unshift(currentSession);
      }
      if (!session.isCheckpoint) {
        currentSession.history ??= [];
        currentSession.history.unshift({
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          xpGained: session.xpGained,
          coinsGained: session.coinsGained,
          wordsRead: session.wordsRead,
          totalTimeMs: session.totalTimeMs,
          percentComplete: session.percentComplete,
          currentPage: session.currentPage,
          completedPages: [...state.completedPages],
          pageCount: state.pageIndexMap.length
        });
      }
      const MAX_SESSION_HISTORY = 20;
      if (currentSession.history?.length > MAX_SESSION_HISTORY) {
        currentSession.history.length = MAX_SESSION_HISTORY;
      }
      if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
      }
      chrome.storage.sync.set({ history }, () => {
        console.log(
          "[SESSIONS] Saved reading session:",
          currentSession
        );
      });
    });
  }
  function getSessionCoinReward() {
    let coins = Math.floor(state.wordsReadSoFar / 500);
    if (state.percentComplete >= 100) {
      coins += 5;
    }
    return coins;
  }
  function saveSessionCheckpoint() {
    if (!state.sessionStartedAt) return;
    if (!state.pageIndexMap.length) return;
    const sessionEnd = state.isPaused && state.pausedAt ? state.pausedAt : Date.now();
    state.totalSessionTime = sessionEnd - state.sessionStartedAt - state.totalPausedMs;
    const checkpoint = {
      url: window.location.href,
      title: document.title,
      currentPage: state.currentPage,
      wordsReadSoFar: state.wordsReadSoFar,
      percentComplete: state.percentComplete,
      completedPages: [...state.completedPages],
      pageCount: state.pageIndexMap.length,
      sessionStartedAt: state.sessionStartedAt,
      totalSessionTime: state.totalSessionTime,
      sessionXp: state.sessionXp,
      savedAt: Date.now()
    };
    chrome.storage.local.set(
      { readerCheckpoint: checkpoint },
      () => {
        console.log(
          "[CHECKPOINT]",
          "Page:",
          checkpoint.currentPage + 1,
          "Progress:",
          checkpoint.percentComplete + "%"
        );
      }
    );
  }

  // popup/petAnimations.js
  var PET_ANIMATIONS = {
    idle: {
      sheet: "Idle.png",
      frames: 10,
      frameWidth: 96,
      width: 96,
      height: 100,
      row: 0
    },
    box: {
      sheet: "Box1.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    box2: {
      sheet: "Box2.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    box3: {
      sheet: "Box3.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    sick1: {
      sheet: "catsick1.png",
      frames: 5,
      frameWidth: 96,
      row: 0
    },
    sick2: {
      sheet: "catsick2.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    cry: {
      sheet: "Cry.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    dance: {
      sheet: "Dance.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    dead: {
      sheet: "DeadCat.png",
      frames: 1,
      frameWidth: 96,
      row: 0
    },
    eating: {
      sheet: "Eating.png",
      frames: 15,
      frameWidth: 96,
      row: 0
    },
    excited: {
      sheet: "Excited.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    idle2: {
      sheet: "Idle2.png",
      frames: 10,
      frameWidth: 96,
      row: 0
    },
    laydown: {
      sheet: "laydown.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    sad: {
      sheet: "Sad.png",
      frames: 9,
      frameWidth: 96,
      row: 0
    },
    sleep: {
      sheet: "Sleep.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    sleepy: {
      sheet: "Sleepy.png",
      frames: 8,
      frameWidth: 96,
      row: 0
    },
    surprised: {
      sheet: "Surprised.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    waiting: {
      sheet: "Waiting.png",
      frames: 6,
      frameWidth: 96,
      row: 0
    },
    //Sprite Sheets:
    refusing: {
      sheet: "AnimationSheet.png",
      frames: 13,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 15
    },
    angry: {
      sheet: "AnimationSheet.png",
      frames: 10,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 16
    },
    shy: {
      sheet: "AnimationSheet.png",
      frames: 12,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 17
    },
    annoyed: {
      sheet: "AnimationSheet.png",
      frames: 4,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 18
    },
    paw: {
      sheet: "AnimationSheet.png",
      frames: 11,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 19
    }
  };

  // popup/pet.js
  var DEFAULT_PET = {
    name: null,
    hunger: 100,
    mood: 100,
    hygiene: 100,
    social: 100,
    energy: 100,
    activity: null,
    activityChangedAt: null,
    currentMood: null,
    dailyCareUses: 3,
    lastCareReset: Date.now(),
    dailyReadingRewards: 0,
    lastReadingReset: Date.now(),
    lastUpdated: Date.now(),
    //evolutionStage: 1,
    inventory: []
  };
  var animationInterval = null;
  function loadPet(callback) {
    chrome.storage.sync.get(["pet"], (data) => {
      const pet = { ...DEFAULT_PET, ...data.pet || {} };
      if (pet.dailyCareUses === void 0) {
        pet.dailyCareUses = 3;
      }
      if (!pet.lastCareReset) {
        pet.lastCareReset = Date.now();
      }
      resetDailyCare(pet);
      resetDailyRewards(pet);
      updatePetDecay(pet);
      savePet(pet);
      callback(pet);
    });
  }
  function savePet(pet) {
    chrome.storage.sync.set({ pet });
  }
  function setPetState(state2) {
    startPetAnimation(state2);
    console.log("[PET] Animation:", state2);
  }
  function startPetAnimation(animation = "idle") {
    const petSprite = document.getElementById("petSprite");
    if (!petSprite) return;
    const config = PET_ANIMATIONS[animation];
    if (!config) return;
    if (!config.frames) return;
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    petSprite.style.backgroundImage = `url("../popup/assets/cat/${config.sheet}")`;
    petSprite.style.width = `${config.width ?? 96}px`;
    petSprite.style.height = `${config.height ?? 96}px`;
    const frameWidth = config.frameWidth ?? 96;
    const frameHeight = config.frameHeight ?? 96;
    const row = config.row ?? 0;
    const startFrame = config.startFrame ?? 0;
    let scale = 1;
    if (config.sheet === "AnimationSheet.png") {
      scale = 3;
      petSprite.style.backgroundSize = `${512 * scale}px ${800 * scale}px`;
    } else {
      petSprite.style.backgroundSize = "";
    }
    let frame = 0;
    const initialX = startFrame * frameWidth * scale;
    const initialY = row * frameHeight * scale;
    petSprite.style.backgroundPosition = `-${initialX}px -${initialY}px`;
    animationInterval = setInterval(() => {
      const currentFrame = startFrame + frame;
      const x = currentFrame * frameWidth * scale;
      const y = row * frameHeight * scale;
      petSprite.style.backgroundPosition = `-${x}px -${y}px`;
      frame = (frame + 1) % config.frames;
    }, 150);
    console.log("[PET]", {
      animation,
      row,
      frameWidth,
      frameHeight,
      startFrame,
      frames: config.frames
    });
  }
  function updatePetDecay(pet) {
    const now = Date.now();
    const hoursPassed = (now - pet.lastUpdated) / (1e3 * 60 * 60);
    pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2.5);
    pet.energy = Math.max(0, pet.energy - hoursPassed * 1.5);
    pet.social = Math.max(0, pet.social - hoursPassed * 1);
    pet.hygiene = Math.max(0, pet.hygiene - hoursPassed * 0.75);
    let moodDecay = hoursPassed * 0.5;
    if (pet.hunger < 25) moodDecay += hoursPassed * 2;
    if (pet.energy < 25) moodDecay += hoursPassed * 1.5;
    if (pet.social < 25) moodDecay += hoursPassed * 1;
    if (pet.hygiene < 25) moodDecay += hoursPassed * 1;
    pet.mood = Math.max(0, pet.mood - moodDecay);
    pet.lastUpdated = now;
  }
  function resetDailyCare(pet) {
    const now = Date.now();
    const lastReset = new Date(pet.lastCareReset || now);
    const today = new Date(now);
    const isNewDay = lastReset.toDateString() !== today.toDateString();
    if (isNewDay) {
      pet.dailyCareUses = 3;
      pet.lastCareReset = now;
    }
  }
  var MAX_DAILY_READING_REWARDS = 10;
  function rewardPetForReading(pet) {
    if (pet.dailyReadingRewards >= MAX_DAILY_READING_REWARDS) {
      return false;
    }
    pet.mood = Math.min(100, pet.mood + 1);
    pet.social = Math.min(100, pet.social + 1);
    pet.dailyReadingRewards++;
    return true;
  }
  function resetDailyRewards(pet) {
    const now = Date.now();
    const lastReset = new Date(pet.lastReadingReset || now);
    const today = new Date(now);
    if (lastReset.toDateString() !== today.toDateString()) {
      pet.dailyReadingRewards = 0;
      pet.lastReadingReset = now;
    }
  }
  function getMoodCoinMultiplier(pet) {
    if (pet.mood >= 80) {
      return 1.2;
    }
    if (pet.mood >= 50) {
      return 1;
    }
    if (pet.mood >= 25) {
      return 0.9;
    }
    return 0.8;
  }
  window.inspectSprite = (file, frames) => {
    const img = new Image();
    img.src = `assets/cat/${file}`;
    img.onload = () => {
      const frameWidth = img.width / frames;
      const scale = 96 / img.height;
      console.log({
        imageWidth: img.width,
        imageHeight: img.height,
        frames,
        originalFrameWidth: frameWidth,
        scaledFrameWidth: frameWidth * scale
      });
    };
  };
  window.testPetAnimation = (animation) => {
    console.log("Testing animation:", animation);
    setPetState(animation);
  };
  window.listPetAnimations = () => {
    console.table(Object.keys(PET_ANIMATIONS));
    const img = new Image();
    img.src = "assets/cat/AnimationSheet.png";
    img.onload = () => {
      console.log(img.width, img.height);
    };
  };

  // content/blur.js
  var blurEnabled = false;
  function toggleBlur() {
    blurEnabled = !blurEnabled;
    if (blurEnabled) {
      document.body.classList.add("fr-blur-all");
    } else {
      document.body.classList.remove("fr-blur-all");
      const bar = document.getElementById("reader-area-bar");
      if (bar) bar.remove();
    }
  }
  function startObserver() {
    function attachObserver() {
      if (!document.body) {
        setTimeout(attachObserver, 50);
        return;
      }
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
          scheduled = false;
          const bar = document.getElementById("reader-area-bar");
          if (!bar) return;
          if (bar.parentElement !== document.documentElement) {
            document.documentElement.appendChild(bar);
          } else {
            document.documentElement.appendChild(bar);
          }
          bar.style.zIndex = "2147483647";
        }, 100);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    attachObserver();
  }

  // content/summary.js
  function showSummaryPage() {
    console.log(
      "[SUMMARY] sessionXp at summary:",
      state.sessionXp
    );
    chrome.storage.sync.set({
      readingActive: false,
      isPaused: false,
      sessionXp: state.sessionXp,
      wordsReadSoFar: state.wordsReadSoFar,
      percentComplete: state.percentComplete
    });
    state.isPaused = false;
    state.pausedAt = null;
    state.totalSessionTime = Date.now() - state.sessionStartedAt - state.totalPausedMs;
    if (state.idleIntervalId) {
      clearInterval(state.idleIntervalId);
      state.idleIntervalId = null;
    }
    if (state.autosaveId) {
      clearInterval(state.autosaveId);
      state.autosaveId = null;
    }
    loadPet((pet) => {
      const sessionCoins = getSessionCoinReward(
        state.percentComplete
      );
      const multiplier = getMoodCoinMultiplier(pet);
      const finalCoins = Math.max(1, Math.round(sessionCoins * multiplier));
      state.sessionReadingCoins = finalCoins;
      state.sessionCoinsGained += finalCoins;
      state.coins += finalCoins;
      state.totalCoinsEarned += finalCoins;
      chrome.storage.sync.set({
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        sessionXp: state.sessionXp
      });
      rewardPetForReading(pet, { xpGained: state.sessionXp });
      savePet(pet);
      console.log("[COINS]", {
        percentComplete: state.percentComplete,
        baseCoins: sessionCoins,
        mood: pet.mood,
        multiplier,
        finalCoins
      });
      if (state.currentPage === 0 && state.wordsReadSoFar === 0 && state.currentPageWords > 0) {
        state.wordsReadSoFar = state.currentPageWords;
      }
      const session = buildReadingSession(state);
      saveReadingSession(session);
      const totalSeconds = Math.floor(session.totalTimeMs / 1e3);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor(totalSeconds % 3600 / 60);
      const seconds = totalSeconds % 60;
      const formattedTime = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
      document.getElementById("reader-page")?.classList.add("hidden");
      document.getElementById("reader-paused")?.classList.add("hidden");
      document.getElementById("reader-summary")?.classList.remove("hidden");
      document.getElementById("summary-content").innerHTML = `
      <div class="summary-header">
        <h1>Reading Summary</h1>
        <p>Your session has been saved.</p>
      </div>

      <div class="summary-stats">

        <div class="summary-stat">
          <span>Title</span>
          <strong>${session.title}</strong>
        </div>

        <div class="summary-stat">
          <span>Session Stats</span>

          <div class="summary-inline">
            <strong>+${session.xpGained} XP |</strong>
            <strong>Level: ${state.level} |</strong>
            <strong>Current XP: ${state.xp} / ${state.required}</strong>
          </div>
        </div>

        <div class="summary-stat">
          <span>Coin Rewards</span>
          <div class="summary-inline">
            <strong>Reading: ${state.sessionReadingCoins} +</strong>
            <strong>Level: ${state.sessionLevelCoins} =</strong>
            <strong>Total Coins gained: +${session.coinsGained}</strong>
          </div>
        </div>

        <div class="summary-stat">
        <span>Reading Stats:</span>
          <div class="summary-inline">
            <strong>Words Read: ${session.wordsRead} |</strong>
            <strong>Time Reading: ${formattedTime} |</strong>
            <strong>Progress: ${(session.percentComplete || 0).toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      <div class="summary-actions">

        <button id="summary-close-btn">
          Close
        </button>

      </div>

      <div id="summary-topic-picker" class="hidden"></div>
    
    `;
      document.getElementById("summary-close-btn")?.addEventListener("click", () => {
        chrome.storage.sync.set({
          readingActive: false
        });
        toggleBlur();
        document.getElementById("reader-area-bar")?.remove();
      });
    });
  }
  function showPausedPage() {
    document.getElementById("reader-page")?.classList.add("hidden");
    document.getElementById("reader-summary")?.classList.add("hidden");
    document.getElementById("reader-paused")?.classList.remove("hidden");
    const resumeBtn = document.getElementById(
      "paused-resume-btn"
    );
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        if (state.pausedAt) {
          const pausedDuration = Date.now() - state.pausedAt;
          state.totalPausedMs += pausedDuration;
        }
        state.pausedAt = null;
        state.isPaused = false;
        chrome.storage.sync.set({
          isPaused: false,
          totalPausedMs: state.totalPausedMs,
          readingActive: true
        });
        resumeReadingPage();
      };
    }
    const finishBtn = document.getElementById("paused-finish-btn");
    if (finishBtn) {
      finishBtn.onclick = () => {
        updateLeveling().then(() => {
          state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
          chrome.storage.sync.set({
            readingActive: false
          });
          showSummaryPage();
          state.isPaused = false;
          state.pausedAt = null;
        });
      };
    }
  }
  function resumeReadingPage() {
    document.getElementById("reader-paused")?.classList.add("hidden");
    document.getElementById("reader-page")?.classList.remove("hidden");
  }

  // content/pagination.js
  var MAX_PAGE_CHARS = 850;
  var MAX_PAGE_SENTENCES = 6;
  var XP_MULTIPLIERS = {
    FIRST_READ: 1,
    SECOND_READ: 0.5,
    REPEAT_READ: 0.25
  };
  function getPageChunkInfo(sentences, startIndex) {
    let chars = 0;
    let count = 0;
    while (startIndex + count < sentences.length) {
      const sentence = sentences[startIndex + count];
      if (!sentence) break;
      if (count >= MAX_PAGE_SENTENCES) {
        break;
      }
      const nextChars = chars + sentence.length;
      if (count > 0 && nextChars > MAX_PAGE_CHARS) {
        break;
      }
      chars = nextChars;
      count++;
    }
    return { count: Math.max(1, count), chars };
  }
  function buildPageIndexMap() {
    const map = [];
    let index = 0;
    while (index < state.allSentences.length) {
      map.push(index);
      const { count } = getPageChunkInfo(state.allSentences, index);
      index += count;
    }
    return map;
  }
  function setActivePage() {
    if (state.allSentences.length === 0) {
      state.allSentences = extractSentences();
    }
    state.articleWordCount = state.allSentences.join(" ").split(/\s+/).filter(Boolean).length;
    if (state.pageIndexMap.length === 0) {
      state.pageIndexMap = buildPageIndexMap();
    }
    const start = state.pageIndexMap[state.currentPage];
    const { count } = getPageChunkInfo(state.allSentences, start);
    const end = start + count;
    state.currentChunk = state.allSentences.slice(start, end);
    const pageText = state.currentChunk.join(" ");
    state.currentPageWords = pageText.split(/\s+/).filter(Boolean).length;
    state.currentPageChars = pageText.length;
    console.log("[PAGE]", {
      page: state.currentPage + 1,
      chars: state.currentPageChars,
      words: state.currentPageWords,
      sentences: state.currentChunk.length
    });
    renderChunk(state.currentChunk);
    updateReaderProgress();
    state.activeElement = start;
  }
  function updateLeveling() {
    console.trace("[LEVEL] updateLeveling called");
    return new Promise((resolve) => {
      const pageId = state.currentPage;
      const sentences = state.currentChunk;
      if (!state.timeStarted) {
        state.timeStarted = Date.now();
        resolve();
        return;
      }
      const timeMs = Date.now() - state.timeStarted;
      if (state.pageXpmap.has(pageId)) {
        console.log("[LEVEL] No XP: paragraph already rewarded.");
        resolve();
        return;
      }
      const { expectedTime, difficulty } = getCachedStats(pageId, sentences);
      console.log("[LEVEL] Time spent:", timeMs, "Expected:", expectedTime);
      if (timeMs < expectedTime) {
        console.log("[LEVEL] No XP: user did not spend enough time.");
        resolve();
        return;
      }
      chrome.storage.sync.get(["history"], (data) => {
        const history = data.history || [];
        const existingArticle = history.filter((item) => item.url === window.location.href).sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];
        const sessionCount = existingArticle?.sessionCount || 0;
        const completedArticle = existingArticle && (existingArticle.status === "completed" || existingArticle.percentComplete >= 100);
        let xpMultiplier = XP_MULTIPLIERS.FIRST_READ;
        const reads = existingArticle?.sessionCount || 0;
        if (completedArticle) {
          const nextRead = reads + 1;
          if (nextRead >= 3) {
            xpMultiplier = XP_MULTIPLIERS.REPEAT_READ;
          } else if (nextRead >= 2) {
            xpMultiplier = XP_MULTIPLIERS.SECOND_READ;
          }
        }
        const gainedXp = Math.max(1, Math.round(difficulty * xpMultiplier));
        state.xp += gainedXp;
        state.sessionXp += gainedXp;
        state.pageXpmap.add(pageId);
        state.completedPages.add(pageId);
        updateCompletionProgress();
        while (state.xp >= getRequiredXp(state.level)) {
          state.xp -= getRequiredXp(state.level);
          const levelReward = getLevelUpCoins(state.level + 1);
          state.level++;
          state.coins += levelReward;
          state.totalCoinsEarned += levelReward;
          state.sessionLevelCoins += levelReward;
          state.sessionCoinsGained += levelReward;
          console.log(
            "[LEVEL] Level up! New level:",
            state.level,
            "Coins Earned:",
            levelReward
          );
        }
        state.required = getRequiredXp(state.level);
        console.log(
          "[LEVEL] XP Award:",
          gainedXp,
          "Current XP:",
          state.xp,
          "/ Required:",
          state.required,
          "Reread Multiplier:",
          xpMultiplier,
          "Coins Gained:",
          state.sessionCoinsGained,
          "Session Count:",
          sessionCount
        );
        chrome.storage.sync.set(
          {
            sessionXp: state.sessionXp,
            xp: state.xp,
            required: state.required,
            level: state.level,
            coins: state.coins,
            totalCoinsEarned: state.totalCoinsEarned,
            totalCoinsSpent: state.totalCoinsSpent
          },
          () => {
            console.log(
              "[LEVEL] Saved XP + Level:",
              state.xp,
              state.level
            );
            state.timeStarted = Date.now();
            resolve();
          }
        );
      });
    });
  }
  function nextPage() {
    console.log(
      "[SUMMARY] Final session XP:",
      state.sessionXp
    );
    console.log("Page: ", state.currentPage + 2);
    if (state.currentPage < state.pageIndexMap.length - 1) {
      state.lastInteraction = Date.now();
      state.paragraphSwitches++;
      state.wordsReadSoFar += state.currentPageWords;
      updateLeveling().then(() => {
        state.currentPage++;
        saveSessionCheckpoint();
        setActivePage();
        chrome.storage.sync.set({
          readingActive: true,
          sessionXp: state.sessionXp,
          wordsReadSoFar: state.wordsReadSoFar,
          currentPageWords: state.currentPageWords,
          percentComplete: state.percentComplete
        });
      });
    } else {
      state.wordsReadSoFar += state.currentPageWords;
      updateLeveling().then(() => {
        updateCompletionProgress();
        state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
        console.log(
          "[SUMMARY] Final session XP:",
          state.sessionXp
        );
        showSummaryPage();
      });
    }
  }
  function prevPage() {
    if (state.currentPage > 0) {
      state.lastInteraction = Date.now();
      console.log("[READER] Interaction: prevPage \u2192 lastInteraction:", state.lastInteraction);
      state.paragraphSwitches++;
      state.currentPage--;
      saveSessionCheckpoint();
      setActivePage();
    }
  }
  function getCachedStats(pageId, sentences) {
    if (state.paragraphCache.has(pageId)) {
      return state.paragraphCache.get(pageId);
    }
    const { chars, sentenceCount } = getParagraphStats(sentences);
    const expectedTime = getExpectedTimeMs(sentences);
    const difficulty = getParagraphDifficulty(sentences);
    const stats = { chars, sentenceCount, expectedTime, difficulty };
    state.paragraphCache.set(pageId, stats);
    return stats;
  }
  function getParagraphStats(sentences) {
    const chars = sentences.reduce((sum, s) => sum + s.length, 0);
    const sentenceCount = sentences.length;
    return { chars, sentenceCount };
  }
  function getExpectedTimeMs(sentences) {
    const text = sentences.join(" ");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = wordCount / 400;
    const rawMs = minutes * 60 * 1e3;
    const finalMs = Math.max(
      3e3,
      Math.min(18e3, Math.round(rawMs))
    );
    console.log("[READ TIME]", {
      words: wordCount,
      rawMs: Math.round(rawMs),
      finalMs
    });
    return finalMs;
  }
  function getParagraphDifficulty(sentences) {
    const { chars } = getParagraphStats(sentences);
    const words = sentences.join(" ").split(/\s+/).filter(Boolean).length;
    let xp = 0;
    xp += words / 50;
    xp += chars / 300;
    xp = Math.max(xp, 3);
    xp = Math.min(xp, 20);
    return Math.round(xp);
  }
  function getRequiredXp(level) {
    return 100 + (level - 1) * 50;
  }
  function updateCompletionProgress() {
    state.percentComplete = Math.round(
      state.completedPages.size / state.pageIndexMap.length * 100
    );
  }
  function getLevelUpCoins(level) {
    if (level <= 5) return 5;
    if (level <= 10) return 10;
    if (level <= 20) return 15;
    return 20 + Math.floor((level - 21) / 10) * 2;
  }

  // content/readerUI.js
  function getActiveTransformFunction() {
    return state.readerSettings.bionic ? transformBionic : transformNormal;
  }
  function renderChunk(chunk) {
    if (!chunk?.length) {
      readerActive.innerHTML = "<p>No readable content found.</p>";
      return;
    }
    const readerActive = document.getElementById("reader-active");
    if (!readerActive) return;
    const transform = getActiveTransformFunction();
    const html = chunk.map(
      (sentence) => sentence.split(" ").map((word) => transform(word)).join(" ")
    ).join("<br>");
    readerActive.innerHTML = html;
  }
  function rerenderReader() {
    if (!state.currentChunk?.length) return;
    renderChunk(state.currentChunk);
  }
  function transformBionic(word) {
    const safeWord = escapeHtml(word);
    const cutoff = Math.ceil(safeWord.length * 0.4);
    const first = safeWord.slice(0, cutoff);
    const rest = safeWord.slice(cutoff);
    return `<span class="bionic-first">${first}</span>${rest}`;
  }
  function updateReaderProgress() {
    const progressEl = document.getElementById("reader-progress");
    if (!progressEl) return;
    const total = state.pageIndexMap.length;
    const current = state.currentPage + 1;
    progressEl.textContent = total > 0 ? `${current} / ${total}` : "0 / 0";
  }
  function injectReaderArea() {
    console.log("[READER UI] injectReaderArea()");
    const existing = document.getElementById("reader-area-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = "reader-area-bar";
    bar.classList.add("extension-theme");
    bar.innerHTML = `
    <div id="reader-page">
      <div id="reader-area-header">
        <span id="reader-status">Reading now</span>
  
        <div class="mini-progress">
          <div id="reader-progress"></div>
        </div>
        <div class="reader-session-actions">
          <button id="reader-pause">Pause</button>
          <button id="reader-finish">Finish Session</button>
          
          <button id="btn-prev">Previous</button>
          <button id="btn-next">Next</button>
        </div>
      </div>
      <div id="reader-active"></div>
    </div>
    <div id="reader-paused" class="hidden">
      <div class="paused-content">
        <h1>Reading Paused</h1>
        <p> Your reading session is currently paused. </p>
        <p> Would you like to continue where you left off? </p>
        <div class="paused-actions">
          <button id="paused-resume-btn">
            Resume Reading
          </button>
          <button id="paused-finish-btn">
            Finish Session
          </button>
        </div>
      </div>
    </div>
      <div id="reader-summary" class="hidden">
        <div id="summary-content"></div>
      </div>
  `;
    document.documentElement.appendChild(bar);
    document.getElementById("btn-next").addEventListener("click", nextPage);
    document.getElementById("btn-prev").addEventListener("click", prevPage);
    const pauseBtn = document.getElementById("reader-pause");
    const finishBtn = document.getElementById("reader-finish");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        console.log("[UI] Pause clicked");
        state.lastInteraction = Date.now();
        state.isPaused = true;
        state.pausedAt = Date.now();
        chrome.storage.sync.set({
          isPaused: true,
          pausedAt: state.pausedAt
        });
        showPausedPage();
      });
    }
    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        console.log("[UI] Finish clicked");
        if (state.idleIntervalId) {
          clearInterval(state.idleIntervalId);
          state.idleIntervalId = null;
        }
        updateLeveling().then(() => {
          state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
          chrome.storage.sync.set({
            readingActive: false
          });
          showSummaryPage();
        });
      });
    }
  }
  function updateReaderStyle() {
    const bar = document.getElementById("reader-area-bar");
    if (!bar) return;
    bar.style.setProperty("--reader-font", state.readerSettings.font);
    bar.style.setProperty("--reader-font-size", state.readerSettings.fontSize + "px");
    const targets = $$(".extension-theme");
    targets.forEach((el) => {
      el.classList.remove("theme-dark", "theme-light", "theme-forest");
      el.classList.add(state.readerSettings.theme);
    });
    rerenderReader();
  }
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function transformNormal(word) {
    return escapeHtml(word);
  }

  // content/messaging.js
  function setupMessaging() {
    const api = globalThis.browser || globalThis.chrome;
    api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      switch (msg.action) {
        case "ping":
          sendResponse({ ok: true });
          return false;
        case "start-reader":
          chrome.storage.sync.get([
            "xp",
            "level",
            "required",
            "coins",
            "totalCoinsEarned",
            "totalCoinsSpent"
          ], (data) => {
            try {
              if (data.xp !== void 0) state.xp = data.xp;
              if (data.level !== void 0) state.level = data.level;
              if (data.required !== void 0) state.required = data.required;
              if (data.coins !== void 0) state.coins = data.coins;
              if (data.totalCoinsEarned !== void 0) state.totalCoinsEarned = data.totalCoinsEarned;
              if (data.totalCoinsSpent !== void 0) state.totalCoinsSpent = data.totalCoinsSpent;
              console.log("[LEVEL] Loaded XP + Level:", state.xp, state.level);
              chrome.storage.local.remove("readerCheckpoint");
              state.sessionStartedAt = Date.now();
              state.allSentences = [];
              state.pageIndexMap = [];
              state.currentChunk = [];
              state.activeElement = null;
              state.currentPage = 0;
              console.log("[TITLE]", document.title);
              state.articleTitle = msg.articleTitle || document.title;
              state.articleWordCount = 0;
              state.wordsReadSoFar = 0;
              state.currentPageWords = 0;
              state.currentPageChars = 0;
              state.coinsAtStart = state.coins;
              state.levelAtStart = state.level;
              state.sessionXp = 0;
              state.sessionCoinsGained = 0;
              state.sessionLevelCoins = 0;
              state.sessionReadingCoins = 0;
              state.percentComplete = 0;
              state.paragraphSwitches = 0;
              state.sessionStatus = "active";
              state.sessionStartPercent = msg.resumePercent || 0;
              state.topicId = null;
              state.sessionCategory = "Reading";
              state.sessionNotes = [];
              state.sessionTags = [];
              state.pageXpmap.clear();
              state.paragraphCache.clear();
              state.completedPages = new Set(msg.completedPages || []);
              state.pausedAt = null;
              state.isPaused = false;
              state.totalPausedMs = 0;
              state.totalSessionTime = 0;
              chrome.storage.sync.set({
                // Persist live session data so popup.js can display statistics even when reopened
                readingActive: true,
                sessionStartedAt: state.sessionStartedAt,
                articleTitle: state.articleTitle,
                //coinsGained: 0,
                sessionXp: 0,
                wordsReadSoFar: 0,
                currentPageWords: 0,
                percentComplete: 0,
                sessionReadingCoins: 0,
                pausedAt: null,
                totalPausedMs: 0,
                isPaused: false
              });
              state.timeStarted = Date.now();
              state.lastInteraction = Date.now();
              console.log("[READER] Started at:", state.timeStarted);
              if (state.idleIntervalId) {
                clearInterval(state.idleIntervalId);
              }
              if (msg.settings) {
                Object.assign(state.readerSettings, msg.settings);
              }
              toggleBlur();
              if (!blurEnabled) {
                sendResponse({ ok: true, active: false });
                return;
              }
              injectReaderArea();
              const selectedText = msg.selectedText?.trim();
              if (selectedText) {
                console.log("[READER] Using selected text");
                state.allSentences = extractSentencesFromText(selectedText);
              } else {
                console.log("[READER] Using Readability extraction");
                state.allSentences = extractSentences();
              }
              state.pageIndexMap = buildPageIndexMap();
              if (state.completedPages.size > 0) {
                state.percentComplete = Math.round(
                  state.completedPages.size / state.pageIndexMap.length * 100
                );
              } else {
                state.currentPage = 0;
              }
              if (msg.resumePage !== void 0) {
                state.currentPage = Math.max(
                  0,
                  Math.min(msg.resumePage, state.pageIndexMap.length - 1)
                );
              }
              updateReaderStyle();
              setActivePage();
              sendResponse({
                ok: true,
                active: true
              });
            } catch (err) {
              console.error("[CONTENT] start-reader error:", err);
              sendResponse({
                ok: false,
                error: err.message
              });
            }
          });
          return true;
        case "next-page":
          nextPage();
          sendResponse({ ok: true });
          break;
        case "pause-reader":
          console.log("[MESSAGING] pause-reader received");
          state.lastInteraction = Date.now();
          state.isPaused = true;
          state.pausedAt = Date.now();
          showPausedPage();
          chrome.storage.sync.set({
            isPaused: true,
            pausedAt: state.pausedAt
          });
          sendResponse({ ok: true });
          break;
        case "resume-reader":
          state.lastInteraction = Date.now();
          if (state.pausedAt) {
            const pausedDuration = Date.now() - state.pausedAt;
            state.totalPausedMs += pausedDuration;
          }
          state.pausedAt = null;
          state.isPaused = false;
          chrome.storage.sync.set({
            isPaused: false,
            pausedAt: null,
            totalPausedMs: state.totalPausedMs,
            readingActive: true
          });
          sendResponse({ ok: true });
          break;
        case "finish-reader":
          if (state.idleIntervalId) {
            clearInterval(state.idleIntervalId);
            state.idleIntervalId = null;
          }
          console.log("[MESSAGING] finish-reader received");
          updateLeveling().then(() => {
            state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
            chrome.storage.sync.set({
              readingActive: false
            });
            chrome.storage.local.remove("readerCheckpoint");
            showSummaryPage();
            sendResponse({ ok: true });
          });
          return true;
        case "reader-active":
          sendResponse({
            active: !!document.getElementById(
              "reader-area-bar"
            )
          });
          break;
        case "set-basic-font":
          state.readerSettings.font = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-bionic":
          state.readerSettings.bionic = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-font-size":
          state.readerSettings.fontSize = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-theme":
          state.readerSettings.theme = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        default:
          console.log("[CONTENT] Unknown action:", msg.action);
          break;
      }
      return true;
    });
  }

  // content/content.js
  globalThis.browser = globalThis.browser || globalThis.chrome;
  function init() {
    console.log(
      "[FRAME CHECK]",
      window.location.href,
      window === window.top
    );
    if (window !== window.top) {
      return;
    }
    startObserver();
    setupMessaging();
    console.log("[READER] Running on:", window.location.href);
  }
  init();
})();
