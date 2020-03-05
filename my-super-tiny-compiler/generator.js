let AST_TYPE = require('./AST-TYPE');

function codeGenerator(node) {
    switch (node.type) {
        case AST_TYPE.PROGRAM:
            return node.body.map(codeGenerator).join('\n');
        case AST_TYPE.STATEMENT:
            return (codeGenerator(node.expression) + ';');
        case AST_TYPE.CALL_EXPRESSION:
            return (codeGenerator(node.callee) + '(' + node.arguments.map(codeGenerator).join(',') + ')');
        case AST_TYPE.NUMBER_LITERAL:
            return node.value;
        case AST_TYPE.ID:
            return node.name;
        default:
            throw new TypeError(node.type);
    }
}

exports.generator = function (node) {
    //c代码生成
    return codeGenerator(node);
};