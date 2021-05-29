module.exports = (numero_turma, quantidade_alunos) => {
  
    const calcula_outliers = (percentual) => {
      return Math.round((quantidade_alunos * percentual) / 100);
    }
  
    return {
      turma: numero_turma,
      quantidade_alunos: quantidade_alunos,
      softskills: [
        'Resolução de Problemas',
        'Comunicação Eficaz',
        'Gestão de Tempo',
        'Foco',
        'Criatividade',
        'Colaboração',
        'Flexibidade',
        'Liderança de Equipe',
        'Auto-Controle',
        'Trabalhar sob pressão',
        'Trabalhar orientado para Resultados',
        'Produtividade',
        'Negociação',
        'Gestão de Conflitos',
        'Equilíbrio Emocional',
        'Proatividade',
        'Motivação',
        'Disciplina',
      ],
  
      hardskills_turma: {
        'API': {
          capacidade: {
            de: 20,
            ate: 30,
            outliers_perc_maiores_ate: calcula_outliers(0),
            outliers_perc_menores_de: calcula_outliers(0)
          }
        },
        'REST': {
          capacidade: {
            de: 10,
            ate: 30,
            outliers_perc_maiores_ate: calcula_outliers(0),
            outliers_perc_menores_de: calcula_outliers(0)
          }
        },
        'Firebase': {
          capacidade: {
            de: 40,
            ate: 45,
            outliers_perc_maiores_ate: calcula_outliers(0),
            outliers_perc_menores_de: calcula_outliers(0)
          }
        }
      },
  
      hardskills_atividade: {
        'API': {
          peso: 20
        },
        'REST': {
          peso: 40
        },
        'Firebase': {
          peso: 40
        }
      }
  
    }
  }