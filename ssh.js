'use strict'
require('dotenv').config()
const { readFileSync } = require('fs')

const blessed = require('blessed')
const { Server } = require('ssh2')

function noop (v) {}
/**
 * @source https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
 */
const colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',

  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',
  FgGray: '\x1b[90m',
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m',
  BgGray: '\x1b[100m'
}
new Server(
  {
    hostKeys: [readFileSync('host.key')]
  },
  (client) => {
    let stream
    let name

    client
      .on('authentication', (ctx) => {
        let nick = ctx.username
        let lowered

        // if (!["keyboard-interactive"].includes(ctx.method))
        //   return ctx.reject(["keyboard-interactive"]);

        name = nick
        ctx.accept()
      })
      .on('ready', () => {
        let rows
        let cols
        let term
        client.once('session', (accept, reject) => {
          accept()
            .once('pty', (accept, reject, info) => {
              rows = info.rows
              cols = info.cols
              term = info.term
              accept && accept()
            })
            .on('window-change', (accept, reject, info) => {
              rows = info.rows
              cols = info.cols
              if (stream) {
                stream.rows = rows
                stream.columns = cols
                stream.emit('resize')
              }
              accept && accept()
            })
            .once('shell', (accept, reject) => {
              stream = accept()
              // users.push(stream);

              stream.name = name
              stream.rows = rows || 24
              stream.columns = cols || 80
              stream.isTTY = true
              stream.setRawMode = noop
              stream.on('error', noop)

              const screen = new blessed.screen({
                autoPadding: true,
                smartCSR: true,
                program: new blessed.program({
                  input: stream,
                  output: stream
                }),
                terminal: term || 'ansi'
              })

              screen.title = `Jebatted`
              // Disable local echo
              screen.program.attr('invisible', true)

              const output = (stream.output = new blessed.log({
                screen: screen,
                top: 0,
                left: 0,
                width: '100%',
                bottom: 2,
                scrollable: false,
                scrollOnInput: false
              }))
              screen.append(output)
              // output.add(`\ne\n`)
              const box = new blessed.box({
                screen: screen,
                height: 1,
                bottom: 1,
                left: 0,
                width: '100%',

                type: 'line',
                scrollable: false,

                ch: '\x1b[36m=\x1b[0m'
              })
              screen.append(box)
              const chars = '=\\/*%^$#@!~&|<>?;:❚░≋█▄▀۞'.split('')
              setInterval(() => {
                const c = [
                  '{red-fg}',
                  '{green-fg}',
                  '{blue-fg}',
                  '{yellow-fg}',
                  '{magenta-fg}',
                  '{cyan-fg}',
                  '{white-fg}',
                  '{gray-fg}'
                ]
                const zeChar = chars[Math.floor(Math.random() * chars.length)]
                const theColor = c[Math.floor(Math.random() * c.length)]
                const zecolors = Object.keys(colors).filter((e) =>
                  e.toLowerCase().startsWith('fg')
                )
                const zeColor =
                  colors[zecolors[Math.floor(Math.random() * zecolors.length)]]
                box.ch = `${zeColor}${zeChar}${colors.Reset}`
                const msg = readFileSync('msg.txt').toString()
                output.content = msg.replace('CUSTOM_COLOR', theColor)
                screen.render()
              }, 500)

              // Local greetings
              output.parseTags = true
              output.add(`{center}{bold}Loading...{/bold}{/center}`)
              // output.add(`\u001b[2J\u001b[0;0H`)
              // output.add(`{center}Some different {bold}{red-fg}content{/red-fg}{/bold}.{/center}`)
              setTimeout(() => {
                output.content = ''
                output.add(`\u001b[2J\u001b[0;0H`)
                screen.render()
                stream.write('\u001b[2J\u001b[0;0H')
                stream.write(`\x1Bc`)
                return stream.end()
              }, 15 * 60 * 1000)
              screen.key(['escape', 'q', 'C-c', '^C'], function (ch, key) {
                output.content = ''
                output.add(`\u001b[2J\u001b[0;0H`)
                screen.render()
                stream.write('\u001b[2J\u001b[0;0H')
                stream.write(`\x1Bc`)
                return stream.end()
              })

              screen.render()
              // XXX This fake resize event is needed for some terminals in order to
              // have everything display correctly
              screen.program.emit('resize')
            })
        })
      })
      .on('close', () => {
        if (stream !== undefined) {
        }
      })
      .on('error', (err) => {
        // Ignore errors
      })
  }
).listen(process.env.PORT || 0, function () {
  console.log('Listening on port ' + this.address().port)
})
