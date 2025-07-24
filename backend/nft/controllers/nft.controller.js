import NFT from '../models/nft.js';

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
