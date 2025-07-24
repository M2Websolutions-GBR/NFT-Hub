import NFT from '../models/nft.js';

export const uploadNFT = async (req, res) => {
  try {
    const { title, description, imageUrl, price, creatorId, editionLimit } = req.body;

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
