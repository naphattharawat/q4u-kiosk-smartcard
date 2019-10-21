const smartcard = require('smartcard')
const CommandApdu = smartcard.CommandApdu
const legacy = require('legacy-encoding')
const moment = require('moment')
const fs = require('fs')

moment.locale('th')
let cmdIndex = 0
let checkMod = 0
let imgTemp = ''
let inGetImage = false

const mergeObject = {
  'cid': 'getCID',
  'person': 'getPerson',
  'address': 'getAddress',
  'issue_expire': 'getIssueExpire',
  'issuer': 'getIssuer',
  'image': 'getImage'
}
const data = {}

const render = {
  getCID: function (card) {
    return new Promise((resolve, reject) => {
      card.issueCommand((new CommandApdu({
        bytes: [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d]
      }))).then((r) => {
        card.issueCommand((new CommandApdu({
          bytes: [0x00, 0xc0, 0x00, 0x00, 0x0d]
        }))).then((r) => {
          r = r.slice(0, -2)
          resolve(r.toString())
        })
      })
    })
  },
  getPerson: function (card) {
    return new Promise((resolve, reject) => {
      card.issueCommand((new CommandApdu({
        bytes: [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0xd1]
      }))).then((response) => {
        card.issueCommand((new CommandApdu({
          bytes: [0x00, 0xc0, 0x00, 0x00, 0xd1]
        }))).then((response) => {
          var buffer = legacy.decode(response, 'tis620')
          let nameTH = buffer.substr(0, 100).trim().split('#')
          let nameEN = buffer.substr(100, 100).trim().split('#')
          resolve({
            name: {
              th: {
                prefix: nameTH[0],
                firstname: nameTH[1],
                lastname: nameTH[3]
              },
              en: {
                prefix: nameEN[0],
                firstname: nameEN[1],
                lastname: nameEN[3]
              }
            },
            dob_js: new Date(parseInt(buffer.substr(200, 4).trim().split('#')) - 543, buffer.substr(204, 2).trim().split('#'), buffer.substr(206, 2).trim().split('#')),
            dob_db: `${buffer.substr(200, 4).trim().split('#') - 543}-${buffer.substr(204, 2).trim().split('#')}-${buffer.substr(206, 2).trim().split('#')}`,
            dob: `${buffer.substr(206, 2).trim().split('#')}/${buffer.substr(204, 2).trim().split('#')}/${buffer.substr(200, 4).trim().split('#') - 543}`,
            sex: buffer.substr(208, 1).trim().split('#')
          })
        })
      })
    })
  },
  getAddress: function (card) {
    return new Promise((resolve, reject) => {
      card.issueCommand((new CommandApdu({
        bytes: [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0x64]
      }))).then((response) => {
        card.issueCommand((new CommandApdu({
          bytes: [0x00, 0xc0, 0x00, 0x00, 0x64]
        }))).then((response) => {
          var buffer = legacy.decode(response, 'tis620')
          var ad = buffer.split('#')
          let address = {
            houseNo: ad[0].trim(),
            villageNo: ad[1].trim(),
            lane: ad[2].trim(),
            road: ad[3].trim(),
            unknow: ad[4].trim(),
            tambon: ad[5].replace('ตำบล', '').trim(),
            amphur: ad[6].replace('อำเภอ', '').trim(),
            province: ad[7].replace('จังหวัด', '').trim()
          }
          resolve(address)
        })
      })
    })
  },
  getIssueExpire: function (card) {
    return new Promise((resolve, reject) => {
      card.issueCommand((new CommandApdu({
        bytes: [0x80, 0xb0, 0x01, 0x67, 0x02, 0x00, 0x12]
      }))).then((response) => {
        card.issueCommand((new CommandApdu({
          bytes: [0x00, 0xc0, 0x00, 0x00, 0x12]
        }))).then((response) => {
          let buffer = legacy.decode(response, 'tis620')
          let issueYear = parseInt(buffer.substr(0, 4)) - 543
          let issueMonth = parseInt(buffer.substr(4, 2))
          let issueDate = parseInt(buffer.substr(6, 2))

          let expireYear = parseInt(buffer.substr(8, 4)) - 543
          let expireMonth = parseInt(buffer.substr(12, 2))
          let expireDate = parseInt(buffer.substr(14, 2))

          resolve({
            issue: moment(`${issueYear}-${issueMonth}-${issueDate}`, 'YYYY-MM-DD').format('YYYY-MM-DD'),
            expire: moment(`${expireYear}-${expireMonth}-${expireDate}`, 'YYYY-MM-DD').format('YYYY-MM-DD')
          })
        })
      })
    })
  },
  getIssuer: function (card) {
    return new Promise((resolve, reject) => {
      card.issueCommand((new CommandApdu({
        bytes: [0x80, 0xb0, 0x00, 0xf6, 0x02, 0x00, 0x64]
      }))).then((response) => {
        card.issueCommand((new CommandApdu({
          bytes: [0x00, 0xc0, 0x00, 0x00, 0x64]
        }))).then((response) => {
          var buffer = legacy.decode(response, 'tis620')
          resolve(buffer.trim().replace(' ', ''))
        })
      })
    })
  },
  getImage: function (card) {
    return new Promise((resolve, reject) => {
      const CMD_PHOTO = [
        [0x80, 0xb0, 0x01, 0x7B, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x02, 0x7A, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x03, 0x79, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x04, 0x78, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x05, 0x77, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x06, 0x76, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x07, 0x75, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x08, 0x74, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x09, 0x73, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0A, 0x72, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0B, 0x71, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0C, 0x70, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0D, 0x6F, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0E, 0x6E, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x0F, 0x6D, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x10, 0x6C, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x11, 0x6B, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x12, 0x6A, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x13, 0x69, 0x02, 0x00, 0xFF],
        [0x80, 0xb0, 0x14, 0x68, 0x02, 0x00, 0xFF]
      ]
      var imgTxt = ''

      CMD_PHOTO.forEach((d, i) => {
        card.issueCommand((new CommandApdu({
          bytes: d
        }))).then((response) => {
          // console.log('------------------------------------')
          // console.log(response)
          card.issueCommand((new CommandApdu({
            bytes: [0x00, 0xc0, 0x00, 0x00, 38]
          }))).then((response) => {
            // imgTxt = imgTxt + response.toString('base64')
            // console.log('------------------------------------')
            // console.log(i)

            // console(i)
            // if (i === 20) {
            //   console.log('sdaaaaaaaaaaaaaaaaaaaaa')
            // }
          })
        })
      })
      console.log(imgTxt)
      resolve(true)
      // let ccc = 255
      // let xwd
      // let xof = (cmdIndex) * ccc + 379
      // if (cmdIndex === 20) { xwd = 38 } else { xwd = ccc }

      // let sp2 = (xof >> 8) & 0xff
      // let sp3 = xof & 0xff
      // let sp6 = xwd & 0xff
      // let spx = xwd & 0xff
      // let CMD1 = [0x80, 0xb0, sp2, sp3, 0x02, 0x00, sp6]
      // let CMD2 = [0x00, 0xc0, 0x00, 0x00, sp6]

      // card.issueCommand((new CommandApdu({
      //   bytes: CMD1
      // }))).then((response) => {
      //   // console.log(`Response image2 '${response.toString('hex')}`)
      //   // card.issueCommand((new CommandApdu({ bytes: CMD2 })))
      //   //   .then((response) => {
      //   //     imgTemp = imgTemp + response.toString('base64')
      //   //     checkMod = checkMod + 1
      //   //     if (cmdIndex < 20) {
      //   //       ++cmdIndex
      //   //       inGetImage = true
      //   //       render.getImage(card)
      //   //       // readImageOneLine(card)
      //   //     } else {
      //   //       let mImgTemp = imgTemp
      //   //       inGetImage = false
      //   //       var stream = fs.createWriteStream('my_file.txt')
      //   //       stream.once('open', function (fd) {
      //   //         stream.write(mImgTemp)
      //   //         stream.end()
      //   //       })

      //   //       fs.writeFile('out.jpg', mImgTemp, 'base64', function (err) {
      //   //         console.log(err)
      //   //       })
      //   //     }
      //   //     resolve(true)
      //   //   })
      //   resolve(true)
      // })
    })
  }
}

module.exports = {
  getCard: (card, request) => {
    function rdfn(index, max, card) {
      return new Promise((resolve, reject) => {
        render[mergeObject[request[index]]](card).then((r) => {
          data[request[index]] = r
          if (index === max) {
            resolve(data)
          } else {
            index = index + 1
            rdfn(index, max, card).then((r) => {
              resolve(r)
            })
          }
        })
      })
    }
    return new Promise((resolve, reject) => {
      rdfn(0, request.length - 1, card).then((r) => {
        resolve(r)
      })
    })
  }
}
