const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Chance = require('chance');
const params = require('./config/parametros.js')();

var serviceAccount = require("../gpask-1ab93-firebase-adminsdk-sok1f-7f786cc583.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//2 - RODAR FUNCTION PARA GERAR PIORES CASOS (POSTMAN)
exports.random_pior_caso = functions.https.onRequest(async (request, response) => {

    let numero_turma = request.body.turma;
    let quantidade = request.body.quantidade;
    let quantidade_turmas = request.body.quantidade_turmas;

    turma = await db.collection("turmas").doc(String(numero_turma)).get()
        .then((doc) => {
            return doc.data();
        });

    let total_alunos = turma.alunos.length;
    let quantidade_grupos = total_alunos / quantidade;

    for (let j = 0; j < quantidade_turmas; j++) {

        grupos = {}

        for (let i = 0; i < quantidade_grupos; i++) {
            grupos[`grupo_${i + 1}`] = []
        }

        let grupo_corrente = 1;

        while (turma.alunos.length > 0) {

            if (grupo_corrente > Math.ceil(quantidade_grupos)) grupo_corrente = 1;

            let posicao = getRandomInt(1, turma.alunos.length) - 1

            let aluno = turma.alunos[posicao]

            grupos[`grupo_${grupo_corrente}`].push(aluno)

            turma.alunos.splice(posicao, 1);
            grupo_corrente += 1;

        }

        db.collection('turmas').doc(String(numero_turma))
            .collection('piores_casos').doc().set({
                grupos,
                hardskills_atividade: turma.hardskills_atividade
            });
    }

    response.json('agrupamentos aleatórios realizados')
});

//1 - RODAR FUNCTION PARA GERAR MOCK DE TURMAS 
exports.mock = functions.https.onRequest((request, response) => {

    const chance = new Chance();
    const { turma, hardskills_atividade } = params;

    require('./libs/ClassroomGenerate.js')(chance)

    const { alunos, analise_hardskills_turma } = chance.classroom(params);

    db.collection('turmas').doc(String(turma)).set({
        alunos,
        analise: analise_hardskills_turma,
        hardskills_atividade

    }, { merge: true }).then(function (doc) {

        response.json(doc);

    });

});




/*exports.helloWorld = functions.https.onRequest((request, response) => {

    db.collection('professores').doc().set({
        nome: 'Celso Neskier',
        titulacao: 'Doutor',
        idade: 35
    }, { merge: true }).then(function (doc) {
        response.send(doc);
    });

});

exports.trigger = functions.firestore.document('professores/{userId}')
    .onWrite((change, context) => {
        console.log(change.after.data());

        const data = change.after.data();
        const previous = change.before.data();

        if (previous) {
            if (data.nome == previous.nome) {
                return null;
            }
        }

        let count = data.alteracao_nome;

        if (!count) {
            count = 0;
        }

        return change.after.ref.set({
            alteracao_nome: count + 1
        }, { merge: true }).then(function () {
            console.log('alterei');
        });

    });*/
