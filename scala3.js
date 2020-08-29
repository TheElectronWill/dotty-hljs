function highlightDotty(hljs) {

  // identifiers
  const camelId = /[a-z][$\w]*/
  const pascalId = /\b[A-Z][$\w]*\b/
  const alphaId = /[a-zA-Z$_][$\w]*/
  const op = /[^\s\w\d,"'()[\]{}]+/
  const id = new RegExp(`(${alphaId.source}((?<=_)${op.source})?|${op.source}|\`.*?\`)`)

  // numbers
  const hexDigit = '[a-fA-F0-9]'
  const hexNumber = `0[xX]${hexDigit}((${hexDigit}|_)*${hexDigit}+)?`
  const decNumber = `0|([1-9]((\\d|_)*\\d)?)`
  const exponent = `[eE][+-]?\\d((\\d|_)*\\d)?`
  const floatingPointA = `(${decNumber})?\\.\\d((\\d|_)*\\d)?${exponent}[fFdD]?`
  const floatingPointB = `${decNumber}${exponent}[fFdD]?`
  const number = new RegExp(`(${hexNumber}|${floatingPointA}|${floatingPointB}|(${decNumber}[lLfFdD]?))`)

  // Regular Keywords
  // The "soft" keywords (e.g. 'using') are added later on a case-by-case basis
  const alwaysKeywords = {
    $pattern: /(\w+|\?\?\?|=>>|\?=>|=>|<:|>:|_|<-|\.nn)/,
    keyword:
      'abstract case catch class def do else enum export extends final finally for given '+
      'if implicit import lazy match new object package private protected override return '+
      'sealed then throw trait true try type val var while with yield => =>> ?=> <: >: _ <-',
    literal: 'true false null this super',
    built_in: '??? asInstanceOf isInstanceOf assert assertFail implicitly locally summon .nn'
  }

  // End of class, enum, etc. header
  const templateDeclEnd = /({|: *\n|\n(?! *(extends|with|derives)))/

  // name <title>
  function titleFor(name) {
    return {
      className: 'title',
      begin: `(?<=${name} )${id.source}`
    }
  }

  const TYPE_ID = {
    className: 'type',
    begin: pascalId,
  }

  const NUMBER = {
    className: 'number',
    begin: number,
    relevance: 0
  }

  const TPARAMS = {
    begin: /\[/, end: /\]/,
    contains: [
      {
        className: 'type',
        begin: id,
        keywords: {
          $pattern: /[<>:]{1,2}/,
          keyword: '<: >: :'
        }
      }
    ],
    relevance: 3
  }

  const COLON_TYPE = {
    begin: /: */, end: /( = |[\s(),/])/,
    excludeBegin: true,
    returnEnd: true,
    endsWithParent: true,
    contains: [TYPE_ID, TPARAMS]
  }

  // Class or method parameters declaration
  const PARAMS = {
    className: 'params',
    begin: /\(/, end: /\)/,
    excludeBegin: true,
    excludeEnd: true,
    keywords: {
      $pattern: alwaysKeywords.$pattern,
      keyword: 'var val implicit inline using ?=> => =>>',
      literal: alwaysKeywords.literal,
      built_in: alwaysKeywords.built_in
    },
    contains: [
      {
        className: 'type',
        begin: /(: *|using|=>> *|=> *)/, end: /[,=\s]/,
        excludeBegin: true, excludeEnd: true,
        endsWithParent: true
      },
      hljs.QUOTE_STRING_MODE,
      NUMBER
    ]
  }

  // String interpolation
  const SUBST = {
    className: 'subst',
    variants: [
      {begin: /\$[a-zA-Z_]\w*/},
      {
        begin: /\${/, end: /}/,
        contains: [
          NUMBER,
          hljs.QUOTE_STRING_MODE
        ]
      }
    ]
  };
  const STRING = {
    className: 'string',
    variants: [
      hljs.QUOTE_STRING_MODE,
      {
        begin: '"""', end: '"""',
        contains: [hljs.BACKSLASH_ESCAPE],
        relevance: 10
      },
      {
        begin: alphaId.source + '"', end: '"',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST],
        illegal: /\n/,
        relevance: 5
      },
      {
        begin: alphaId.source + '"""', end: '"""',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST],
        relevance: 10
      }
    ]
  }

  // Class or method apply
  const APPLY = {
    begin: /\(/, end: /\)/,
    excludeBegin: true, excludeEnd: true,
    keywords: {
      $pattern: alwaysKeywords.$pattern,
      keyword: 'using => ?=> =>>',
      literal: alwaysKeywords.literal,
      built_in: alwaysKeywords.built_in
    },
    contains: [
      STRING,
      NUMBER,
      TYPE_ID
    ]
  }

  // @annot(...)
  const ANNOTATION = {
    className: 'meta',
    begin: `@${id.source}(\.${id.source})*`,
    contains: [
      APPLY
    ]
  }

  // Documentation
  const SCALADOC = hljs.COMMENT('/\\*\\*', '\\*/', {
    contains: [
      {
        className: 'doctag',
        begin: /@[a-zA-Z]+/
      },
      // markdown syntax elements:
      {
        className: 'code',
        variants: [
          {begin: /```.*\n/, end: /```/},
          {begin: /`/, end: /`/}
        ],
      },
      {
        className: 'bold',
        variants: [
          {begin: /\*\*/, end: /\*\*/},
          {begin: /__/, end: /__/}
        ],
      },
      {
        className: 'emphasis',
        variants: [
          {begin: /\*(?![\*\s/])/, end: /\*/},
          {begin: /_/, end: /_/}
        ],
      },
      {
        className: 'bullet', // list item
        begin: /- (?=\S)/, end: /\s/,
      },
      {
        className: 'link',
        begin: /(?<=\[.*?\])\(/, end: /\)/,
      }
    ]
  })

  // Methods
  const METHOD = {
    className: 'function',
    begin: /(transparent\s+)?(inline\s+)?def/, end: / =|\n/,
    excludeEnd: true,
    relevance: 5,
    keywords: {
      $pattern: alwaysKeywords.$pattern,
      keyword: 'def inline transparent ?=> => =>>',
      built_in: alwaysKeywords.built_in
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      titleFor('def'),
      TPARAMS,
      PARAMS,
      COLON_TYPE,
      TYPE_ID
    ]
  }

  // Variables & Constants
  const VAL = {
    beginKeywords: 'val var', end: /[=;\n]/,
    excludeEnd: true,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      titleFor('(val|var)'),
      APPLY, // for function types
      COLON_TYPE
    ]
  }

  // Type declarations
  const TYPEDEF = {
    begin: /(opaque\s+)?type/, end: /[=;\n]/,
    excludeEnd: true,
    keywords: 'opaque type this',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      titleFor('type'),
      TYPE_ID
    ]
  }

  // Given instances (for the soft keyword 'as')
  const GIVEN = {
    begin: /given/, end: /[=;\n]/,
    excludeEnd: true,
    keywords: 'as given using',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      titleFor('given'),
      PARAMS,
      {
        className: 'type',
        begin: /as /, end: /((?!=>)[=\s{:])/,
        excludeBegin: true, excludeEnd: true,
        endsWithParent: true
      },
      TYPE_ID
    ]
  }

  // Extension methods
  const EXTENSION = {
    begin: /extension/, end: /(\n|def)/,
    excludeEnd: true,
    keywords: 'extension implicit using',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      PARAMS,
      TYPE_ID
    ]
  }

  // 'end' soft keyword
  const END = {
    begin: `end(?= (if|while|for|match|try|given|extension|this|val|${id.source})\\n)`, end: /\s/,
    keywords: 'end'
  }

  // Classes, traits, enums, etc.
  const EXTENDS_PARENT = {
    begin: ' extends ', end: /( with | derives )/,
    endsWithParent: true,
    returnEnd: true,
    keywords: 'extends',
    contains: [APPLY, TYPE_ID]
  }
  const WITH_MIXIN = {
    begin: ' with ', end: / derives /,
    endsWithParent: true,
    returnEnd: true,
    keywords: 'with',
    contains: [APPLY, TYPE_ID],
    relevance: 10
  }
  const DERIVES_TYPECLASS = {
    begin: ' derives ', end: /\n/,
    endsWithParent: true,
    returnEnd: true,
    keywords: 'derives',
    contains: [TYPE_ID],
    relevance: 10
  }

  const CLASS = {
    className: 'class',
    begin: /class|open class|case class|trait|enum|object|package object/, end: templateDeclEnd,
    keywords: 'open case class trait object enum package extends with derives private protected',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      titleFor('(class|trait|object|enum)'),
      TPARAMS,
      PARAMS,
      EXTENDS_PARENT,
      WITH_MIXIN,
      DERIVES_TYPECLASS,
      TYPE_ID
    ]
  }

  // Case in enum
  const ENUM_CASE = {
    begin: /case (?!.*=>)/, end: /\n/,
    keywords: 'case',
    excludeEnd: true,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        // case A, B, C
        className: 'title',
        begin: `(?<=(case|,) *)${id.source}`
      },
      PARAMS,
      EXTENDS_PARENT,
      WITH_MIXIN,
      DERIVES_TYPECLASS,
      TYPE_ID
    ]
  }

  // Case in pattern matching
  const MATCH_CASE = {
    begin: /case/, end: /=>/,
    keywords: 'case',
    excludeEnd: true,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        begin: /[@_]/,
        keywords: {
          $pattern: /[@_]/,
          keyword: '@ _'
        }
      },
      {
        className: 'title',
        begin: camelId
      },
      NUMBER,
      STRING,
      TYPE_ID
    ]
  }

  return {
    name: 'Scala3',
    aliases: ['scala', 'dotty'],
    keywords: alwaysKeywords,
    contains: [
      NUMBER,
      STRING,
      SCALADOC,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      METHOD,
      VAL,
      TYPEDEF,
      CLASS,
      GIVEN,
      EXTENSION,
      ANNOTATION,
      ENUM_CASE,
      MATCH_CASE,
      END,
      APPLY,
      TYPE_ID
    ]
  }
}
