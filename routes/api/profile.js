const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const { route } = require('./users');

/*
@route GET api/profile/me
@desc Get current users profile
@access private
*/
router.get('/me', auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',
        ['name','avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/*
@route POST api/profile
@desc Create/Update user's profile
@access private
*/
router.post('/', [auth,[
    check('status', 'status is required')
        .not()
        .isEmpty(),
    check('skill', 'skill is required')
        .not()
        .isEmpty()
]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        location,
        bio,
        status,
        githubusername,
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
      } = req.body;

    const profileField = {}
    profileField.user = req.user.id;
    if(company) profileField.company = company;
    if(website) profileField.website = website;
    if(location) profileField.location = location;
    if(bio) profileField.bio = bio;
    if(status) profileField.status = status;
    if(githubusername) profileField.githubusername = githubusername;
    if(skills){
        profileField.skills = skills.split(',').map(skill => skill.trim());
    }

    profileField.social = {}
    if(youtube) profileField.social.youtube = youtube;
    if(twitter) profileField.social.twitter = twitter;
    if(facebook) profileField.social.facebook = facebook;
    if(linkedin) profileField.social.linkedin = linkedin;
    if(instagram) profileField.social.instagram = instagram;
    
    try{
        let profile = await Profile.findOne({ user: req.user.id});

        if(profile){
            profile = await Profile.findOneAndUpdate(
                { user : req.user.id }, 
                { $set : profileField },
                { new : true}
            );
            return res.json(profile);
        }

        profile = new Profile(profileField);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


/*
@route GET api/profile
@desc Get all/profile
@access public
*/
router.get('/', async (req,res) => {
    try{
        const profiles = await Profile.find().populate('user',
        ['name','avatar']);
        res.json(profiles);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
})

/*
@route GET api/profile/user/:user_id
@desc Get profile by userId
@access public
*/

router.get('/user/:user_id', async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user',
        ['name','avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    }catch(err){
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server error');
    }
})


module.exports = router;
