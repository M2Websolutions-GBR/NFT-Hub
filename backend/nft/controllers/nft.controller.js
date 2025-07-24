import NFT from '../models/nft.js';
import axios from 'axios';

export const uploadNFT = async (req, res) => {
  try {
    const { title, description, imageUrl, price, editionLimit } = req.body;
    const creatorId = req.user.id; // aus dem JWT
    // Grundvalidierung
    if (!title || !imageUrl || !price || !creatorId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newNFT = new NFT({
      title,
      description,
      imageUrl,
      price,
      creatorId,
      editionLimit,
    });

    await newNFT.save();

    res.status(201).json({ message: 'NFT created successfully', nft: newNFT });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating NFT' });
  }
};

export const getAllNFTs = async (req, res) => {
  try {
    const nfts = await NFT.find().sort({ createdAt: -1 }); // Neueste zuerst
    res.status(200).json(nfts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching NFTs' });
  }
};

export const getMyNFTs = async (req, res) => {
  try {
    const creatorId = req.user.id;

    const myNFTs = await NFT.find({ creatorId }).sort({ createdAt: -1 });

    res.status(200).json(myNFTs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching your NFTs' });
  }
};

export const getCreatorProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({ message: 'Creator ID is required' });
    }

    // NFTs laden
    const nfts = await NFT.find({ creatorId }).sort({ createdAt: -1 });

    // Auth-Service aufrufen (lokal!)
    const authRes = await axios.get(`http://localhost:3001/api/auth/user/${creatorId}`);
    const creator = authRes.data;

    res.status(200).json({ creator, nfts });
  } catch (err) {
    console.error('Error loading creator profile:', err.message);
    res.status(500).json({ message: 'Error loading creator profile' });
  }
};

