const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Chance = require('chance');

var serviceAccount = require("../gpask-1ab93-firebase-adminsdk-sok1f-7f786cc583.json");
const { INGRESS_SETTINGS_OPTIONS } = require("firebase-functions");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 3 - RODAR FUNCTION PARA GERAR ANALYZER
exports.analyzer = functions.https.onRequest(async (request, response) => {

    let numero_turma = request.query.turma;

    grupos = await db.collection("turmas").doc(String(numero_turma))
        .collection("melhor_caso").doc(String(numero_turma) + '_melhor_caso').get()
        .then((doc) => {
            return doc.data();
        });

    //------
    // Comparar a proporção interna do saber baseado no peso das hardskills na atividade
    // Mensurar Distancia entre os grupos
    // Validar distribuição complementar das softskills (quantidade maior)

    let min_deficit_distribuicao = 100;
    let max_deficit_distribuicao = 0;

    let min_softskill = 100;
    let max_softskill = 0;

    for (let g in grupos.grupos) {

        let grupo = grupos.grupos[g];
        let total_integrantes = grupo.length;
        let softskills = [];

        let conhecimento_grupo = {
            hardskills: {},
            total_conhecimento_hardskills: 0,
        }

        for (let a in grupo) {

            let aluno = grupo[a];

            for (let s in aluno.softskills) {
                let softskill = aluno.softskills[s];
                if (!softskills.includes(softskill)) {

                    softskills.push(softskill);
                }
            }

            for (let h in aluno.hardskills) {

                let hardskill = aluno.hardskills[h];

                conhecimento_grupo.total_conhecimento_hardskills += hardskill.nota;

                if (!conhecimento_grupo.hardskills.hasOwnProperty(h)) {
                    conhecimento_grupo.hardskills[h] = {
                        total_pontos: hardskill.nota
                    }
                } else {
                    conhecimento_grupo.hardskills[h].total_pontos += hardskill.nota
                }

            }

        }

        let deficit_distribuicao = 0;

        for (let h in conhecimento_grupo.hardskills) {

            let hardskill = conhecimento_grupo.hardskills[h]

            conhecimento_grupo.hardskills[h].percentual = (hardskill.total_pontos * 100) / conhecimento_grupo.total_conhecimento_hardskills

            if (conhecimento_grupo.hardskills[h].percentual < grupos.hardskills_atividade[h].peso) {

                let deficit = grupos.hardskills_atividade[h].peso - conhecimento_grupo.hardskills[h].percentual;
                deficit_distribuicao += deficit;

            } else {

            }

        }

        if (deficit_distribuicao < min_deficit_distribuicao) {
            min_deficit_distribuicao = deficit_distribuicao
        }

        if (deficit_distribuicao > max_deficit_distribuicao) {
            max_deficit_distribuicao = deficit_distribuicao
        }

        conhecimento_grupo['deficit_hardskills_absoluto'] = deficit_distribuicao;

        conhecimento_grupo['media_softskills'] = softskills.length / total_integrantes

        if (conhecimento_grupo['media_softskills'] < min_softskill) {
            min_softskill = conhecimento_grupo['media_softskills']
        }

        if (conhecimento_grupo['media_softskills'] > max_softskill) {
            max_softskill = conhecimento_grupo['media_softskills']
        }

        grupos.grupos[g] = {
            conhecimento_grupo
        }

    }

    let gap_softskill = 0;

    for (let cg in grupos.grupos) {
        let grupo = grupos.grupos[cg].conhecimento_grupo

        let gap = (max_softskill - grupo.media_softskills) / (max_softskill - min_softskill)

        if (gap > 0 && gap < 1) {
            gap_softskill += gap
        }

    }

    let gap_hardskill = 0;

    for (let cg in grupos.grupos) {
        let grupo = grupos.grupos[cg].conhecimento_grupo

        let gap = (min_deficit_distribuicao - grupo.deficit_hardskills_absoluto) / (min_deficit_distribuicao - max_deficit_distribuicao)

        grupos.grupos[cg].conhecimento_grupo['deficit_hardskills_relativo'] = grupo.deficit_hardskills_absoluto * gap
        if (gap > 0 && gap < 1) {
            gap_hardskill += gap
        }

    }

    let analise = {
        grupos: grupos.grupos,
        gap_hardskill: gap_hardskill,
        gap_softskill: gap_softskill,
        acuracia: 100 - (9 * gap_hardskill) + (1 * gap_softskill)
    }

    db.collection('turmas').doc(String(numero_turma))
        .collection('melhor_caso').doc(String(numero_turma) + '_melhor_caso')
        .collection('analise').doc(String(numero_turma) + '_analise').set({
            analise
        });

    response.json("Análise finalizada com sucesso!");

});

//2 - RODAR FUNCTION PARA GERAR MELHORES CASOS 
exports.melhor_caso = functions.https.onRequest(async (request, response) => {

    let numero_turma = request.query.turma;
    let alunos_por_grupo = request.query.alunos_por_grupo;

    turma = await db.collection("turmas").doc(String(numero_turma)).get()
        .then((doc) => {
            return doc.data();
        });

    const pesoHardskills = turma.hardskills_atividade;
    let total_alunos = turma.alunos.length;

    for (let i = 0; i < turma.alunos.length; i++) {

        let aluno = turma.alunos[i];

        let grau = (aluno.hardskills.API.nota * pesoHardskills.API.peso)
            + (aluno.hardskills.REST.nota * pesoHardskills.REST.peso)
            + (aluno.hardskills.Firebase.nota * pesoHardskills.Firebase.peso);

        aluno['grau_hardskills'] = grau;
    }

    // ordenando do menor para o maior grau
    let alunos_ordenados = turma.alunos.sort(function (alunoA, alunoB) {
        return alunoA.hardskills.grau_hardskills - alunoB.hardskills.grau_hardskills
    });

    // agrupando os piores com melhores
    duplas = [];
    let posicao_primeiro_aluno = 0;
    let posicao_ultimo_aluno = alunos_ordenados.length - 1;
    let isCurrent = true;

    for (let i = 0; i < alunos_ordenados.length; i++) {

        if (isCurrent) {

            duplas.push(alunos_ordenados[posicao_primeiro_aluno]);
            posicao_primeiro_aluno++;
            isCurrent = false;

        } else {

            duplas.push(alunos_ordenados[posicao_ultimo_aluno]);
            posicao_ultimo_aluno--;
            isCurrent = true;

        }
    }

    let sobra_alunos = total_alunos % alunos_por_grupo;
    let metade_grupo = alunos_por_grupo / 2;

    let quantidade_grupos = sobra_alunos >= metade_grupo ? Math.ceil(total_alunos / alunos_por_grupo)
        : Math.trunc(total_alunos / alunos_por_grupo);

    array_grupos = []

    for (let i = 0; i < quantidade_grupos; i++) {
        array_grupos[i] = []
        array_grupos[i]['grau_total_grupo'] = 0;
    }

    let grupo_corrente = 0;
    let alunos_adicionados = 1;
    let alunos_restantes = []

    for (let i = 0; i < duplas.length; i++) {

        if (alunos_adicionados > alunos_por_grupo) {

            grupo_corrente++;
            alunos_adicionados = 1;
        }

        if (grupo_corrente < quantidade_grupos) {

            array_grupos[grupo_corrente].push(duplas[i]);
            array_grupos[grupo_corrente].grau_total_grupo += duplas[i].grau_hardskills;
            alunos_adicionados++;

        }
        else {

            alunos_restantes.push(duplas[i])
        }
    }

    //se a sobre de alunos for menor que a metade da quantidade de alunos por grupo, redistribui os alunos
    if (sobra_alunos < metade_grupo) {

        // ordenando grupos do maior para o menor grau
        array_grupos.sort(function (grupoA, grupoB) {
            return grupoB.grau_total_grupo - grupoA.grau_total_grupo
        });

        //ordenando alunos restantes do menor para o maior grau 
        let alunos_restantes_ordenados = alunos_restantes.sort(function (alunoA, alunoB) {
            return alunoA.grau_total_grupo - alunoB.grau_total_grupo
        });

        //redistribuindo o aluno de menor grau para o grupo de maior grau
        for(let i = 0; i < alunos_restantes_ordenados.length; i++){

            array_grupos[i].push(alunos_restantes_ordenados[i]);

        }
    }

    //nomeando os grupos para inserir no firestore
    grupos = {}
    index = 0;

    for (let i = 1; i <= quantidade_grupos; i++) {

        grupos[`grupo_${i}`] = array_grupos[index]
        index++;
    }

    db.collection('turmas').doc(String(numero_turma))
        .collection('melhor_caso').doc(String(numero_turma) + '_melhor_caso').set({
            grupos,
            hardskills_atividade: turma.hardskills_atividade
        });

    response.json("Melhor Caso finalizado com sucesso!");

});

//1 - RODAR FUNCTION PARA GERAR MOCK DE TURMAS 
exports.mock = functions.https.onRequest((request, response) => {

    const chance = new Chance();

    let numero_turma = request.query.turma;
    let quantidade_alunos = request.query.quantidade_alunos;
    const params = require('./config/parametros.js')(numero_turma, quantidade_alunos);

    const { turma, hardskills_atividade } = params;

    require('./libs/ClassroomGenerate.js')(chance)

    const { alunos, analise_hardskills_turma } = chance.classroom(params);

    db.collection('turmas').doc(String(turma)).set({
        alunos,
        analise: analise_hardskills_turma,
        hardskills_atividade

    }, { merge: true }).then(function (doc) {

        response.json("Mock da Turma gerado com sucesso!");

    });
});

