const TOKEN = require('./TOKEN.json');
const ASTType = require('./AST-TYPE.json');
let curIndex = 0;//指向待处理的Token
let tokens;//token列表
let id = 0;
function getNextToken() {
    return tokens[curIndex++];
}

function lookAhead() {
    return tokens[curIndex];
}

function matchNextToken(tokenType) {
    return tokens[curIndex].type === tokenType
}

function generateASTNode() {
    //生成AST节点
    let token = getNextToken();
    //判断是否为数字
    if (token.type === TOKEN.NUMBER) {
        //token为数字
        return {
            id:id++,
            type: ASTType.NUMBER_LITERAL,
            value: token.value
        }
    }
    //判断是否为方法调用
    if (token.type === TOKEN.PAREN && token.value === '(') {
        //匹配左括号，继续匹配标识符
        token = getNextToken();
        if (token.type === TOKEN.NAME) {
            //匹配标识符
            let astNode = {
                id:id++,
                type: ASTType.CALL_EXPRESSION,
                name: token.value,
                params: []
            };
            token = lookAhead();
            //接下去使用DFS匹配列表参数，直到遇到右圆括号
            while (token.value !== ')') {
                astNode.params.push(generateASTNode());
                token = lookAhead();
            }
            getNextToken();//读取右圆括号
            return astNode;
        }

    }
    throw new TypeError("Unrecognized token: " + token);
}

exports.parser = function (outerTokens) {
    //语法分析器
    tokens = outerTokens;
    let ast = {
        id:id++,
        type: ASTType.PROGRAM,
        body: []
    };

    while (!matchNextToken(TOKEN.EOF)) {
        //一直读取token直到文件末尾
        ast.body.push(generateASTNode());
    }
    return ast;
};