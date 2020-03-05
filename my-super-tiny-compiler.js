let lexer = require("./my-super-tiny-compiler/lexer").lexer;
let parser = require("./my-super-tiny-compiler/parser").parser;
let transform = require("./my-super-tiny-compiler/transform").transform;
let codeGenerator = require("./my-super-tiny-compiler/generator").generator;
function compile(input) {
    try {
        let tokens = lexer(input);
        console.log(tokens);
        let ast = parser(tokens);
        console.log(JSON.stringify(ast));
        let newAst = transform(ast);
        console.log(JSON.stringify(newAst));
        console.log(codeGenerator(newAst))
    } catch (e) {
        console.log(e)
    }
}

let input = '(add 2 (subtract (add 2 (add 3 4)) 2))';
compile(input);
