'use strict'

const cron = require('node-cron')

/**
 * ARIA Scheduler — manages recurring routines.
 */
function createScheduler(store, logger, notify) {
  const jobs = new Map()

  function start() {
    const settings = store.getAll()
    const { routines } = settings

    if (routines.morningEnabled) {
      const [h, m] = routines.morningTime.split(':')
      schedule('morning', `${m} ${h} * * 1-5`, runMorningRoutine)
    }

    if (routines.eveningEnabled) {
      const [h, m] = routines.eveningTime.split(':')
      schedule('evening', `${m} ${h} * * 1-5`, runEveningRoutine)
    }

    if (routines.weeklyEnabled) {
      schedule('weekly', '0 9 * * 1', runWeeklyRoutine)
    }

    if (routines.monthlyEnabled) {
      schedule('monthly', '0 8 1 * *', runMonthlyRoutine)
    }

    logger.info('scheduler-started', { jobs: [...jobs.keys()] })
  }

  function schedule(name, expression, fn) {
    if (jobs.has(name)) jobs.get(name).stop()
    const job = cron.schedule(expression, () => {
      logger.info('routine-start', { name })
      fn().then(() => logger.info('routine-done', { name }))
           .catch((err) => logger.error('routine-error', { name, error: err.message }))
    }, { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    jobs.set(name, job)
  }

  async function runMorningRoutine() {
    notify({
      type: 'routine',
      title: 'Bom dia! Rotina Matinal',
      body:  'Verificando emails, agenda e pendências do dia...',
    })
    // Actual integrations (email, calendar) are invoked here when configured
  }

  async function runEveningRoutine() {
    notify({
      type: 'routine',
      title: 'Rotina de Encerramento',
      body:  'Resumindo o dia, verificando pendências e fazendo backup...',
    })
  }

  async function runWeeklyRoutine() {
    notify({
      type: 'routine',
      title: 'Relatório Semanal',
      body:  'Gerando relatório da semana...',
    })
  }

  async function runMonthlyRoutine() {
    notify({
      type: 'routine',
      title: 'Relatório Mensal',
      body:  'Gerando relatório financeiro e de produtividade do mês...',
    })
  }

  function stop() {
    for (const [, job] of jobs) job.stop()
    jobs.clear()
  }

  return { start, stop, schedule }
}

module.exports = { createScheduler }
