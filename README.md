# Demo Thai smartcard with Nodejs
 อ่านข้อมูลบัตรประชาชน ด้วย Nodejs 

เริ่มการติดตั้ง จะต้องมี node-gyp เสียก่อน ประหนึ่งว่า เป็นตัว Tool ที่เป็น cross-platform command-line ของ nodejs เพื่อ คอมไพล์ native addon modules

- สำหรับ Window (cmd หรือ powerShall ก็ได้โหมด admin นะ)

```
npm install --global --production windows-build-tools

npm install --global node-gyp 
```

- สำหรับ Unix และ MacOS ต้องทำการลง python รายละเอียด [ที่นี้](https://github.com/nodejs/node-gyp)  และ [ที่นี่](https://stackoverflow.com/questions/21365714/nodejs-error-installing-with-npm)

หลังจากนั้นก็ npm install หรือ yarn add ตามปกติ 

---
หาก Run แล้วมีปัญหา ...

```
Error: SCardEstablishContext error: The Smart Card Resource Manager is not running 
```

ไม่ต้องตกใจ ให้ทำการเข้าไปที่ service ของ windows แล้วไป สั่ง start service name ที่ชื่อว่า Smart Card 
[รายละเอียด](http://computerstepbystep.com/smart_card_service.html)