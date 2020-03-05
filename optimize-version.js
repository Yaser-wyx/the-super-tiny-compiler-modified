//TODO 非本人编写！！！

// 接受代码字符串input
function tokenizer(input) {
  // 剩余待处理字符
  let rest = input;
  // 输出结果集合，存放词法单元
  let tokens = [];
  // 各词素对应的正则表达式
  const REGEX = {
    PAREN: /^\(|^\)/,
    WHITESPACE: /^\s+/,
    NUMBERS: /^\d+/,
    STRING: /^"([^"]+)?"/,
    NAME: /^[a-z]+/i
  };

  // 遍历字符串，挑出词法单元
  while (rest.length > 0) {
    let type, value;
    // 匹配结果，本次匹配消费掉的串长度
    let matched, span;

    // 匹配左括号、右括号
    if (matched = rest.match(REGEX.PAREN)) {
      type = 'paren';
    }
    // 跳过空白字符
    else if (matched = rest.match(REGEX.WHITESPACE)) {
      rest = rest.slice(matched[0].length);
      continue;
    }
    // 匹配数值
    else if (matched = rest.match(REGEX.NUMBERS)) {
      type = 'number';
    }
    // 匹配形如"abc"的字符串
    else if (matched = rest.match(REGEX.STRING)) {
      type = 'string';
      value = matched[1] || '';
      span = matched[0].length;
    }
    // 匹配函数名，要求只含大小写字母
    else if (matched = rest.match(REGEX.NAME)) {
      type = 'name';
    }
    // 无法识别的字符，报错
    else {
      throw new TypeError('Unexpected character: ' + rest);
    }

    value = value || matched[0];
    tokens.push({type, value});
    rest = rest.slice(span || matched[0].length);
  }

  return tokens;
}

function parser(tokens) {
  // 当前正在处理的token索引
  let current = 0;

  // 递归遍历（因为函数调用允许嵌套），把token转成AST节点
  function walk() {
    let token = tokens[current];

    // 数值
    if (token.type === 'number') {
      current++;

      // 生成一个AST节点，表示数值字面量
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // 字符串
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 函数调用
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {
      // 丢掉左括号，取下一个token作为函数名
      token = tokens[++current];

      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 看下一个token
      token = tokens[++current];

      // 右括号之前的所有token解析完都是参数
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk());
        token = tokens[current];
      }
      // 吃掉右括号
      current++;

      return node;
    }

    // 无法识别的token，报错
    throw new TypeError(token.type);
  }

  // AST的根节点
  let ast = {
    type: 'Program',
    body: [],
  };
  // 填充ast.body，允许多条语句，所以放循环里
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

function traverser(ast, visitor) {
  // 遍历AST节点数组
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {
    // 从visitor取出对应的一组方法
    let methods = visitor[node.type];
    // 通知visitor我们正在访问node
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    switch (node.type) {
      // 根节点
      case 'Program':
        traverseArray(node.body, node);
        break;
      // 函数调用
      case 'CallExpression':
        traverseArray(node.params, node);
        break;
      // 数值和字符串，没孩子，不用处理
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // 无法识别的AST节点，报错
      default:
        throw new TypeError(node.type);
    }

    // 通知visitor我们要离开node了
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // 开始遍历
  traverseNode(ast, null);
}

// 输入Lisp AST，输出C AST
function transformer(ast) {
  // 新AST的根节点
  let newAst = {
    type: 'Program',
    body: [],
  };

  // 用额外的数据结构维持新旧AST的联系
  let stack = [newAst.body];
  function peak() {
    return stack[stack.length - 1];
  }

  // 创建vistor，开始遍历
  traverser(ast, 
    {
    // 数值和字符串，直接原样插入新AST
    NumberLiteral: {
      enter(node, parent) {
        let newASTHost = peak();
        newASTHost.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      }
    },
    StringLiteral: {
      enter(node, parent) {
        let newASTHost = peak();
        newASTHost.push({
          type: 'StringLiteral',
          value: node.value,
        });
      }
    },
    // 函数调用
    CallExpression: {
      enter(node, parent) {
        let newASTHost = peak();
        // 创建不同的AST节点
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 函数调用可以有孩子，建立节点对应关系，供子节点使用
        stack.push(expression.arguments);

        // 顶层函数调用算是语句，包装成特殊的AST节点
        if (parent.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        newASTHost.push(expression);
      },
      leave(node, parent) {
        // 参数收集结束，回到上一层
        stack.pop();
      }
    }
  });

  return newAst;
}

// 递归遍历新AST，输出代码字符串
function codeGenerator(node) {
  switch (node.type) {
    // 根节点，把body里的所有内容都生成一遍，按行输出
    case 'Program':
      return node.body.map(codeGenerator).join('\n');

    // 表达式语句，处理其表达式内容，并添上分号
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) + ';'
      );

    // 函数调用，添上括号，参数用逗号分隔
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator).join(', ') +
        ')'
      );

    // 标识符，数值，原样输出
    case 'Identifier':
      return node.name;
    case 'NumberLiteral':
      return node.value;

    // 字符串，用双引号包起来再输出
    case 'StringLiteral':
      return '"' + node.value + '"';

    // 无法识别的新AST节点，报错
    default:
      throw new TypeError(node.type);
  }
}

function compiler(input) {
  let tokens = tokenizer(input);
  let ast    = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  return output;
}

// test
// const input  = '(add 2 (subtract 4 2))';
// let output = compiler(input);
// console.log(output);

module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
