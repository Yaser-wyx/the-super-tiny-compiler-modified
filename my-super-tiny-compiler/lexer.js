let tokens = [];//存储最终的token
let curIndex = 0;//input的指针，永远指向待读取的字符
const TOKEN = require('./TOKEN.json');
let input;

function getNextChar() {
    //读取下一个字符
    return input[curIndex++];
}

function lookAhead() {
    //查看下一个字符，不读取
    return input[curIndex];
}

function testNext(char) {
    //测试下一个字符
    if (char === "(" || char === ")") {
        //处理括号
        return TOKEN.PAREN;
    }
    let number = /\d/;
    let space = /\s/;
    let name = /[A-Za-z]/;
    if (number.test(char)) {
        return TOKEN.NUMBER;
    }
    if (space.test(char)) {
        return TOKEN.SPACE
    }
    if (name.test(char)) {
        return TOKEN.NAME;
    }
}

function isNumber(char) {
    return testNext(char) === TOKEN.NUMBER;
}

function isName(char) {
    return testNext(char) === TOKEN.NAME;
}

exports.lexer = function (outerInput) {
    input = outerInput;
    //词法分析器
    let pushToken = (type, value) => {
        tokens.push({
            type: type,
            value: value
        })
    };
    while (curIndex < input.length) {
        let char = getNextChar(input);
        switch (testNext(char)) {
            case TOKEN.NAME:
                //循环识别name
                let nameValue = char;
                while (isName(lookAhead(input))) {
                    //下一个是name，读取
                    nameValue += getNextChar(input)
                }
                pushToken(TOKEN.NAME, nameValue);
                break;
            case TOKEN.PAREN:
                pushToken(TOKEN.PAREN, char);
                break;
            case TOKEN.NUMBER:
                let numberValue = char;
                while (isNumber(lookAhead(input))) {
                    //下一个是number，读取
                    numberValue += getNextChar(input)
                }
                pushToken(TOKEN.NUMBER, numberValue);
                break;
            case TOKEN.SPACE:
                //空格不处理
                break;
            default:
                throw new TypeError("Unrecognized token: " + char);
        }

    }
    pushToken(TOKEN.EOF, TOKEN.EOF);
    return tokens;
};

