const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Chance = require('chance');
const params = require('./config/parametros.js')();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("../gpask-1ab93-firebase-adminsdk-sok1f-7f786cc583.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

exports.mock = functions.https.onRequest((request, response) => {
    
    const chance = new Chance();
    const { turma, hardskills_atividade } = params;

    require('./libs/ClassroomGenerate.js')(chance)

    const { alunos, analise_hardskills_turma } = chance.classroom(params);

    //response.json({ alunos, analise_hardskills_turma });

    db.collection('turmas').doc(String(turma)).set({
        alunos,
        analise: analise_hardskills_turma,
        hardskills_atividade

    }, {merge: true}).then(function(doc){
        
        response.json(doc);
    
    });

});




exports.helloWorld = functions.https.onRequest((request, response) => {
    
    db.collection('professores').doc().set({
        nome: 'Celso Neskier',
        titulacao: 'Doutor',
        idade: 35
    }, {merge: true}).then(function(doc){
        response.send(doc);
    });

});

exports.trigger = functions.firestore.document('professores/{userId}')
    .onWrite((change, context) => {
        console.log(change.after.data());

        const data = change.after.data();
        const previous = change.before.data();

        if(previous){
            if(data.nome == previous.nome){
                return null;
            }
        }

        let count = data.alteracao_nome;

        if(!count){
            count = 0;
        }

        return change.after.ref.set({
            alteracao_nome: count + 1
        }, {merge: true}).then(function () {
            console.log('alterei');
        });

    });
