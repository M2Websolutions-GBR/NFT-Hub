import NFT from '../models/nft.js';
import cloudinary from '../config/cloudinary.js';
import axios from 'axios';
import crypto from 'crypto';


export const uploadNFT = async (req, res) => {
  try {
    const { title, description, price, editionLimit } = req.body;
    const file = req.file;
    const creatorId = req.user.id;
    // Datei auslesen (z. B. bei Multer-Upload: req.file.path)

    const user = req.user;

    console.log('Rolle:', user.role);
    console.log('isSubscribed:', user.isSubscribed);


    if (!user.isSubscribed) {
      return res.status(403).json({
        message: 'Du brauchst ein aktives Creator-Abo, um NFTs hochzuladen.'
      });
    }

    if (!title || !price || !file) {
      return res.status(400).json({ message: 'Missing required fields or image' });
    }

    // 🔐 SHA256-Hash aus dem Bildbuffer berechnen
    const imageHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');


    // 🔍 Prüfen, ob der Hash schon existiert
    const duplicateNFT = await NFT.findOne({ imageHash });
    if (duplicateNFT) {
      return res.status(400).json({
        message: 'Dieses Bild wurde bereits als NFT hochgeladen.'
      });
    }

    // ☁️ Bild zu Cloudinary hochladen
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

    const result = await streamUpload();

    // 🆕 Neues NFT erstellen und speichern
    const newNFT = new NFT({
      title,
      description,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      price,
      editionLimit,
      creatorId,
      imageHash
    });

    await newNFT.save();

    res.status(201).json({ message: 'NFT created', nft: newNFT });

  } catch (err) {
    console.error('Error creating NFT:', err.message);
    res.status(500).json({ message: 'Error uploading NFT' });
  }
};

export const updateNFT = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;
    const updates = req.body;

    const nft = await NFT.findById(id);
    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    // Berechtigungsprüfung
    if (nft.creatorId.toString() !== creatorId) {
      return res.status(403).json({ message: 'Not authorized to update this NFT' });
    }

    // Update durchführen
    Object.assign(nft, updates);
    const updatedNFT = await nft.save();

    res.status(200).json({ message: 'NFT updated', nft: updatedNFT });
  } catch (err) {
    console.error('Error updating NFT:', err.message);
    res.status(500).json({ message: 'Error updating NFT' });
  }
};

export const deleteNFT = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const nft = await NFT.findById(id);
    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    if (nft.creatorId.toString() !== creatorId) {
      return res.status(403).json({ message: 'Not authorized to delete this NFT' });
    }

    if (nft.soldCount > 0) {
      return res.status(400).json({ message: 'NFT cannot be deleted after it has been sold' });
    }

    // Bild bei Cloudinary löschen
    if (nft.imagePublicId) {
      await cloudinary.uploader.destroy(nft.imagePublicId);
    }

    await NFT.findByIdAndDelete(id);

    res.status(200).json({ message: 'NFT and image deleted successfully' });

  } catch (err) {
    console.error('Error deleting NFT:', err.message);
    res.status(500).json({ message: 'Error deleting NFT' });
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

export const getNFTById = async (req, res) => {
  try {
    const { id } = req.params;

    const nft = await NFT.findById(id);
    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    // Creator-Daten vom auth-service holen
    const response = await axios.get(`http://server-auth:3001/api/auth/user/${nft.creatorId}`);

    const creator = response.data;

    res.status(200).json({
      nft,
      creator: {
        _id: creator._id,
        username: creator.username,
        email: creator.email,
        role: creator.role,
      }
    });
  } catch (err) {
    console.error('Error fetching NFT with creator info:', err.message);
    res.status(500).json({ message: 'Error fetching NFT or creator data' });
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

// NFT als verkauft markieren (wird vom Payment-Service via PATCH aufgerufen)
export const markAsSold = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ message: 'NFT not found' });

    nft.soldCount += 1;
    if (nft.soldCount >= nft.editionLimit) {
      nft.isSoldOut = true;
    }

    await nft.save();
    res.status(200).json({ message: 'NFT updated after sale', soldCount: nft.soldCount });
  } catch (err) {
    res.status(500).json({ message: 'Error updating NFT', error: err.message });
  }
};