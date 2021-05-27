
const Chance = require('chance');

module.exports = (chance) => {
  chance.mixin({
    'classroom': function ({ quantidade_alunos, turma, softskills, hardskills_turma }) {


      const calcula_hardskill = (nome, hardskills) => {

        aluno_hardskill = {};

        for (h in hardskills) {
          const hardskill = hardskills[h]
          // console.log(hardskill)

          let habilidade_aluno_hardskill = false;
          while (!(!!habilidade_aluno_hardskill)) {

            const nota = chance.floating({ min: 0, max: 100, fixed: 2 });
            // console.log(nome, hardskill.hardskill, nota)

            if (nota <= hardskill.capacidade.ate && nota >= hardskill.capacidade.de) {
              habilidade_aluno_hardskill = nota;
            } else {

              if (nota > hardskill.capacidade.ate
                && hardskill.capacidade.outliers_perc_maiores_ate > 0) {

                hardskill.capacidade.outliers_perc_maiores_ate -= 1;
                habilidade_aluno_hardskill = nota;



              } else if (nota < hardskill.capacidade.de
                && hardskill.capacidade.outliers_perc_menores_de > 0) {

                hardskill.capacidade.outliers_perc_menores_de -= 1;
                habilidade_aluno_hardskill = nota;
              }

            }

          }

          aluno_hardskill[h] = {
            nota: habilidade_aluno_hardskill
          }

        }

        return aluno_hardskill
      }


      let alunos = [];

      let hardskill_antes = hardskills_turma;


      for (let a = 0; a < quantidade_alunos; a++) {
        let chance = new Chance(`${turma}_${a}`);
        alunos.push({
          nome_completo: `${chance.first()} ${chance.last()}`,
          hardskills: calcula_hardskill(chance.first(), hardskills_turma),
          softskills: chance.pickset(softskills, 5)
        })
      }

      analise_hardskills_turma = {}
      for (a in alunos) {
        const aluno = alunos[a];
        for (h in aluno.hardskills) {
          const hardskill = aluno.hardskills[h]
          if (!analise_hardskills_turma.hasOwnProperty(h)) {
            analise_hardskills_turma[h] = {
              total_pontos: hardskill.nota,
              menor: hardskill.nota,
              maior: hardskill.nota,
            }
          } else {

            if (hardskill.nota < analise_hardskills_turma[h].menor) {
              analise_hardskills_turma[h].menor = hardskill.nota;
            }

            if (hardskill.nota > analise_hardskills_turma[h].maior) {
              analise_hardskills_turma[h].maior = hardskill.nota;
            }

            analise_hardskills_turma[h].total_pontos += hardskill.nota
          }
          // console.log(h, hardskill)
        }

      }

      for (a in analise_hardskills_turma) {
        const analise = analise_hardskills_turma[a];

        analise_hardskills_turma[a]['media'] = analise_hardskills_turma[a]['total_pontos'] / quantidade_alunos;
      }

      for (a in alunos) {
        const aluno = alunos[a];



        for (h in aluno.hardskills) {
          const hardskill = aluno.hardskills[h]
          // console.log(h, hardskill)
          aluno.hardskills[h]['diferenca_absoluta_media'] =
            aluno.hardskills[h]['nota'] - analise_hardskills_turma[h]['media']

          aluno.hardskills[h]['gap'] =
            (analise_hardskills_turma[h]['maior'] - aluno.hardskills[h]['nota']) /
            (analise_hardskills_turma[h]['maior'] - analise_hardskills_turma[h]['menor'])
        }

      }
      // console.log(alunos)

      // console.log(analise_hardskills_turma)

      return { alunos, analise_hardskills_turma };
    }
  });
}