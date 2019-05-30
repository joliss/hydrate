let glob = require('glob')
let chalk = require('chalk')
let series = require('run-series')
let fs = require('fs')
let path = require('path')
let child = require('child_process')

/**
  installs deps into
  - functions
  - src/shared
  - src/views
*/
module.exports = function installDeps(callback) {

  // eslint-disable-next-line
  let pattern = 'src/**/@(package\.json|requirements\.txt|Gemfile)'

  let files = glob.sync(pattern).filter(function filter(filePath) {
    if (filePath.includes('node_modules'))
      return false
    if (filePath.includes('vendor/bundle'))
      return false
    return true
  })

  series(files.map(file=> {
    let cwd = path.dirname(file)
    let options = {cwd}
    return function hydration(callback) {

      // printer function
      function exec(cmd, opts, callback) {
        console.log(chalk.green(cwd))
        console.log(chalk.bold.green(cmd))
        child.exec(cmd, opts, callback)
      }

      // also a printer function
      function done(err, stdout, stderr) {
        if (err) {
          console.log(chalk.bgRed.bold.white(err.message))
          console.log(chalk.grey(err.stack))
        }
        if (stdout && stdout.length > 0) {
          console.log(chalk.grey(stdout))
        }
        if (stderr && stderr.length > 0) {
          console.log(chalk.yellow(stderr))
        }
        callback()
      }

      if (file.includes('package.json')) {
        if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
          exec(`npm ci`, options, done)
        }
        else {
          exec(`npm i`, options, done)
        }
      }

      if (file.includes('requirements.txt'))
        exec(`pip3 install -r requirements.txt -t ./vendor`, options, done)

      if (file.includes('Gemfile'))
        exec(`bundle install --path vendor/bundle`, options, done)
    }
  }),
  function done(err) {
    if (err) throw err
    callback()
  })
}
