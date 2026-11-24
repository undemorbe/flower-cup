// Хеш пароля админки для ADMIN_PASSWORD_HASH. Пароль вводится в терминале,
// а не аргументом команды - чтобы не остался в истории shell.
import { createInterface } from 'node:readline'
import { hashPassword } from './auth.js'

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
rl._writeToOutput = (s) => rl.output.write(s.includes('Пароль') ? s : '')
rl.question('Пароль админки (не короче 12 символов): ', (password) => {
  rl.close()
  process.stdout.write('\n')
  if (password.length < 12) {
    console.error('Слишком короткий пароль')
    process.exit(1)
  }
  console.log(`ADMIN_PASSWORD_HASH='${hashPassword(password)}'`)
})
