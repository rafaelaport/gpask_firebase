var admin = require("firebase-admin");

var serviceAccount = require("./gpask-1ab93-firebase-adminsdk-sok1f-7f786cc583.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const insert = async () => {
    db.collection('professores').doc('antonio_podgorski').set({
        nome: 'Antonio Felipe Podgorski Bezerra',
        titulacao: 'Mestre',
        idade: 35
    });
}
insert();

const select = async () => {
    const res = await db.collection('professores').get();

    res.forEach((doc) => {
        console.log(doc.id, doc.data());
    })
}
//select();

const upsert = async () => {
    const user = await db.collection('professores').doc('antonio_podgorski')

    await user.set({
        titulacao: 'Doutorando',
        graduacao: 'Unicarioca'
    }, {merge: true})
}
//upsert();

const update = async () => {
    const user = await db.collection('professores').doc('antonio_podgorski')

    await user.update({
        titulacao: 'Doutorando',
        graduacao: 'Unicarioca'
    })
}
//update();

const remove = async () => {
    const user = await db.collection('professores').doc('antonio_podgorski').delete();
}
//remove();