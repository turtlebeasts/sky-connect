const Post = require("../models/Post");
const User = require("../models/User");

// POST /api/posts
const createPost = async (req, res) => {
  try {
    const { caption, image } = req.body;

    if (!caption?.trim() && !image?.trim()) {
      return res.status(400).json({
        message: "Post must contain a caption or an image",
      });
    }

    const post = await Post.create({
      author: req.user._id,
      caption,
      image,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "username displayName avatar",
    );

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts
const getFeedPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const posts = await Post.find()
      .populate("author", "username displayName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts/user/:username
const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const posts = await Post.find({
      author: user._id,
    })
      .populate("author", "username displayName avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts/:id
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username displayName avatar",
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/posts/:id
const updatePost = async (req, res) => {
  try {
    const { caption, image } = req.body;

    if (caption === undefined && image === undefined) {
      return res.status(400).json({
        message: "Nothing to update",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (caption !== undefined) {
      post.caption = caption;
    }

    if (image !== undefined) {
      post.image = image;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      "author",
      "username displayName avatar",
    );

    res.status(200).json({ post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      message: "Post deleted successfully",
      postId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString(),
    );

    if (alreadyLiked) {
      return res.status(400).json({
        message: "Post already liked",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          likes: req.user._id,
        },
      },
      {
        returnDocument: "after",
      },
    );

    const populatedPost = await Post.findById(updatedPost._id).populate(
      "author",
      "username displayName avatar",
    );

    res.status(200).json({
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE /api/posts/:id/like
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString(),
    );

    if (!alreadyLiked) {
      return res.status(400).json({
        message: "Post is not liked",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          likes: req.user._id,
        },
      },
      {
        returnDocument: "after",
      },
    );

    const populatedPost = await Post.findById(updatedPost._id).populate(
      "author",
      "username displayName avatar",
    );

    res.status(200).json({
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  getFeedPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
