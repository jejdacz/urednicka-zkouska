#!/usr/bin/env node
const fs = require('fs');

const data = fs.readFileSync(__dirname + '/uz-nl.txt', {
    encoding: 'utf8'
});

const answ = fs.readFileSync(__dirname + '/answers.txt', {
    encoding: 'utf8'
});

const answarr = answ.split('\n');

// REMOVE PAGE NUMBERS
const re = /^\d+\n/gm;
const noPage = str => str.replace(re, '');

// REPLACE NEW LINES WITH SPACE
const rn = /([\p{Letter},])[\r\s\n\x20\x0A]+/gu;
const noNl = str => str.replace(rn, '$1 ');


// TRANSFORM TO JSON
const rq = /(?<number>\d+)\.\s?(?<question>.*?)\na\)\s+(?<a>.*?)\nb\)\s+(?<b>.*?)\nc\)\s+(?<c>.*?)\n/gm;
let match = rq.exec(data);
const exam = { questions: [] };
let i = 0;

do {
    // console.log(
    //     `number: ${match.groups.number} question: ${match.groups.question} a): ${match.groups.a} b): ${match.groups.b} c): ${match.groups.c}`
    // );
    exam.questions.push({ 
        number: parseInt(match.groups.number),
        question: match.groups.question, answers: [{ text: match.groups.a, valid: answarr[i] === 'a' }, { text: match.groups.b, valid: answarr[i] === 'b' }, { text: match.groups.c, valid: answarr[i] === 'c' }] });
        i++;
} while ((match = rq.exec(data)) !== null);


 fs.writeFileSync(__dirname + '/exam-json.json', JSON.stringify(exam), {
   encoding: 'utf8'
 });
