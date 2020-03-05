let AST_TYPE = require('./AST-TYPE');

function traverse(lispASTNode, parentNode) {
    //遍历一遍lispAST，并打印出来
    if (lispASTNode.type === AST_TYPE.NUMBER_LITERAL) {
        return {
            type: AST_TYPE.NUMBER_LITERAL,
            value: lispASTNode.value
        }
    }
    let lispArray;
    let cNode;
    let cArray;
    if (lispASTNode.type === AST_TYPE.PROGRAM) {
        lispArray = lispASTNode.body;
        cNode = {
            type: AST_TYPE.PROGRAM,
            body: []
        };
        cArray = cNode.body;
    } else if (lispASTNode.type === AST_TYPE.CALL_EXPRESSION) {
        lispArray = lispASTNode.params;
        cNode = {
            type: AST_TYPE.CALL_EXPRESSION,
            callee: {
                type: AST_TYPE.ID,
                name: lispASTNode.name,
            },
            arguments: [],
        };
        cArray = cNode.arguments;
        //需要判断父节点是否为函数调用
        if (parentNode === null || parentNode.type !== AST_TYPE.CALL_EXPRESSION) {
            //如果不是，则表明当前节点为顶层函数调用
            cNode = {
                type: AST_TYPE.STATEMENT,
                expression: cNode
            };
            cArray = cNode.expression.arguments;
        }
    } else {
        throw new TypeError("Unrecognized ASTNode: " + lispASTNode);
    }
    for (let index = 0; index < lispArray.length; index++) {
        cArray.push(traverse(lispArray[index],lispASTNode));
    }
    return cNode;
}

exports.transform = function (lispAST) {
    //将lisp的AST转换为c的AST
    return traverse(lispAST, null);
};