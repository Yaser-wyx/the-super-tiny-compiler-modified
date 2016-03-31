var assert = require('assert');
var superTinyCompiler = require('../super-tiny-compiler');

var tokenizer = superTinyCompiler.tokenizer;
var parser = superTinyCompiler.parser;
var transformer = superTinyCompiler.transformer;
var codeGenerator = superTinyCompiler.codeGenerator;
var compiler = superTinyCompiler.compiler;

var input = '(add 2 (subtract 4 2))';

var tokens = [
  { type: 'paren',  value: '('        },
  { type: 'name',   value: 'add'      },
  { type: 'number', value: '2'        },
  { type: 'paren',  value: '('        },
  { type: 'name',   value: 'subtract' },
  { type: 'number', value: '4'        },
  { type: 'number', value: '2'        },
  { type: 'paren',  value: ')'        },
  { type: 'paren',  value: ')'        }
];

//test tokenizer
assert.deepStrictEqual(tokenizer(input), tokens);

var ast = {
  type: 'Program',
  body: [{
    type: 'CallExpression',
    name: 'add',
    params: [{
      type: 'NumberLiteral',
      value: '2'
    }, {
      type: 'CallExpression',
      name: 'subtract',
      params: [{
        type: 'NumberLiteral',
        value: '4'
      }, {
        type: 'NumberLiteral',
        value: '2'
      }]
    }]
  }]
};

// test parser/ast
assert.deepStrictEqual(parser(tokens), ast);

var newAst = {
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "Identifier",
          "name": "add"
        },
        "arguments": [
          {
            "type": "NumberLiteral",
            "value": "2"
          },
          {
            "type": "CallExpression",
            "callee": {
              "type": "Identifier",
              "name": "subtract"
            },
            "arguments": [
              {
                "type": "NumberLiteral",
                "value": "4"
              },
              {
                "type": "NumberLiteral",
                "value": "2"
              }
            ]
          }
        ]
      }
    }
  ]
};

assert.deepStrictEqual(transformer(ast), newAst);

var output = 'add(2, subtract(4, 2));';

// test generator
assert.deepStrictEqual(codeGenerator(newAst), output);

// test whole compiler
assert.deepStrictEqual(compiler(input), output);

console.log('All Passed!');
