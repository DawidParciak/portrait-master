const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model')
const requestIp = require("request-ip");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) {

      if (title.length > 25) {
        throw new Error('Title length exceeds the limit of 25 characters.');
      }
  
      if (author.length > 50) {
        throw new Error('Author length exceeds the limit of 50 characters.');
      }

      const titlePattern = new RegExp(
        /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
        "g"
      );

      const authorPattern = new RegExp(
        /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
        "g"
      );
      
      const emailPattern = new RegExp(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "g"
      );

      if (!authorPattern.test(author)) {
        throw new Error("Invalid author");
      }
      if (!emailPattern.test(email)) {
        throw new Error("Invalid email");
      }
      if (!titlePattern.test(title)) {
        throw new Error("Invalid title");
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if((fileExt[1] === '.jpg' || '.png' || '.gif')) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save();
        res.json(newPhoto); 
      } else {
        throw new Error("Wrong file type!");
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const userIp = requestIp.getClientIp(req);
    const findUser = await Voter.findOne({ user: userIp })
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if(findUser) {
      if(findUser.votes.includes(photoToUpdate._id)) {
        res.status(500).json({ message: "You already voted on this photo..." });
      } else {
        photoToUpdate.votes += 1;
        await photoToUpdate.save();
        findUser.votes.push(photoToUpdate._id);
        await findUser.save();
        res.json(photoToUpdate);
      }
    } else {
      const newVoter = new Voter({ user: userIp, votes: [photoToUpdate._id] });
      await newVoter.save();
      photoToUpdate.votes += 1;
      await photoToUpdate.save();
      res.json(photoToUpdate);
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
