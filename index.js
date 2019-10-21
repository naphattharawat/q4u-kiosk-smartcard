const smartcard = require('smartcard')
const Devices = smartcard.Devices
const devices = new Devices()
const CommandApdu = smartcard.CommandApdu
const fse = require('fs-extra');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const data = require('./carddata')
let kioskId;
let urlAPI;
let token;

fse.readJson('./config.json')
  .then(json => {
    kioskId = json.kioskId;
    urlAPI = json.urlAPI;
    token = json.token;
    console.log(urlAPI);

    devices.onActivated().then(event => {
      const currentDevices = event.devices
      let device = event.device
      event.devices.map((device, index) => {
        for (let prop in currentDevices) {
          console.log('Devices: ' + currentDevices[prop])
        }
      })

      device.on('card-inserted', event => {
        let card = event.card
        // console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`)

        card.on('command-issued', event => {
          // console.log(`Command '${event.command}' issued to '${event.card}' `)
        })

        card.issueCommand(new CommandApdu(new CommandApdu({
          bytes: [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
        }))).then((r) => {
          data.getCard(card, ['cid', 'person']).then((r) => {
            const cid = r.cid;
            const thName = r.person.name.th;
            const dob = r.person.dob;
            console.log('=============================================')
            console.log(`CitizenID: ${cid}`)
            console.log(`THName: ${thName.prefix} ${thName.firstname} ${thName.lastname}`)
            console.log(`DOB: ${dob}`)
            console.log('=============================================')

            var xhr = new XMLHttpRequest();
            var data = `token=${token}&kioskId=${kioskId}`;
            data += `&cid=${cid}`;
            data += `&title=${thName.prefix}`;
            data += `&fname=${thName.firstname}`;
            data += `&lname=${thName.lastname}`;
            data += `&birthDate=${dob}`;
            xhr.withCredentials = true;

            xhr.open("POST", `${urlAPI}/kiosk/profile`);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("cache-control", "no-cache");
            xhr.setRequestHeader("Postman-Token", "6e874932-931e-4dd6-9ae2-c6788825d247");
            xhr.send(data);
          })
        }).catch(error => {
          console.error('Error:', error, error.stack)
        })
      })

      device.on('card-removed', event => {
        var data = null;
        var xhr = new XMLHttpRequest();
        var data = `token=${token}&kioskId=${kioskId}`;
        xhr.withCredentials = true;
        xhr.open("DELETE", `${urlAPI}/kiosk/profile`);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(data);
        console.log('== card remove ==')
      })
    })

    devices.on('device-deactivated', event => {
      console.log(`Device '${event.device}' deactivated, devices: [${event.devices}]`)
    })

  }).catch(err => {
    console.log(err);
  })