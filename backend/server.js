const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://haran2231:Harihari@cluster0.2fq7o.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define MongoDB schemas
const contactSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  contactEmail: { type: String, required: true },
  unreadCount: { type: Number, default: 0 } // Track unread messages
});

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});


const Contact = mongoose.model('Contact', contactSchema);
const Message = mongoose.model('Message', messageSchema);
const User = mongoose.model('User', userSchema);

// API routes

// Add contact endpoint
app.post('/add-contact', async (req, res) => {
  const { userEmail, contactEmail } = req.body;

  try {
    // Check if the contact already exists for the user
    const existingContact = await Contact.findOne({ userEmail, contactEmail });

    if (existingContact) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    // Add the new contact
    const contact = new Contact({ userEmail, contactEmail });
    await contact.save();

    res.status(201).json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// Fetch user contacts
app.get('/contacts/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
  try {
    const contacts = await Contact.find({ userEmail });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Send message endpoint
// app.post('/send-message', async (req, res) => {
//   const { senderEmail, receiverEmail, message, status } = req.body;

//   try {
//     if (!senderEmail || !receiverEmail || !message) {
//       return res.status(400).json({ error: 'Required fields are missing' });
//     }

//     // Create and save new message
//     const newMessage = new Message({
//       senderEmail,
//       receiverEmail,
//       message,
//       status: status || 'sent',
//       timestamp: new Date()
//     });

//     await newMessage.save();

//     // Update unread count for the receiver
//     await Contact.findOneAndUpdate(
//       { userEmail: receiverEmail, contactEmail: senderEmail },
//       { $inc: { unreadCount: 1 } },
//       { new: true }
//     );

//     res.status(201).json({ message: 'Message sent successfully', messageId: newMessage._id });
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });

// Update message status endpoint

// Send message endpoint (with auto-contact creation for receiver)
// Send message endpoint
app.post('/send-message', async (req, res) => {
  const { senderEmail, receiverEmail, message, status } = req.body;

  try {
    if (!senderEmail || !receiverEmail || !message) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Create and save new message with default status as 'sent' (single tick)
    const newMessage = new Message({
      senderEmail,
      receiverEmail,
      message,
      status: 'sent',  // This means single tick
      timestamp: new Date()
    });

    await newMessage.save();

    // Check if sender exists in the receiver's contact list and add if not present
    const existingReceiverContact = await Contact.findOne({ userEmail: receiverEmail, contactEmail: senderEmail });

    if (!existingReceiverContact) {
      const newContactForReceiver = new Contact({
        userEmail: receiverEmail,
        contactEmail: senderEmail
      });
      await newContactForReceiver.save();
    }

    res.status(201).json({ message: 'Message sent successfully', messageId: newMessage._id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});



app.post('/update-message-status', async (req, res) => {
  const { messageId, status } = req.body;

  if (!messageId || !status) {
    return res.status(400).json({ error: 'messageId and status are required' });
  }

  try {
    const validStatuses = ['sent', 'delivered', 'read'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedMessage = await Message.findByIdAndUpdate(messageId, { status }, { new: true });

    if (updatedMessage) {
      res.status(200).json({ message: 'Message status updated', updatedMessage });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Fetch messages between users
app.get('/messages/:userEmail/:contactEmail', async (req, res) => {
  const { userEmail, contactEmail } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderEmail: userEmail, receiverEmail: contactEmail },
        { senderEmail: contactEmail, receiverEmail: userEmail }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Fetch unread message count for a specific user
app.get('/unread-count/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
  try {
    const unreadCount = await Message.countDocuments({ receiverEmail: userEmail, readStatus: false });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread messages count' });
  }
});

// Mark messages as read between users
app.post('/mark-read', async (req, res) => {
  const { senderEmail, receiverEmail } = req.body;
  try {
    // Mark all messages from sender to receiver as read
    await Message.updateMany(
      { senderEmail, receiverEmail, readStatus: false },
      { $set: { readStatus: true, status: 'read' } } // Update status to 'read' (double tick)
    );

    // Reset unread count for the contact
    await Contact.findOneAndUpdate(
      { userEmail: receiverEmail, contactEmail: senderEmail },
      { unreadCount: 0 },
      { new: true }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});


// Clear chat between users
app.delete('/clear-chat/:userEmail/:contactEmail', async (req, res) => {
  const { userEmail, contactEmail } = req.params;
  try {
    await Message.deleteMany({
      $or: [
        { senderEmail: userEmail, receiverEmail: contactEmail },
        { senderEmail: contactEmail, receiverEmail: userEmail }
      ]
    });
    res.status(200).json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});


// store user name
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    // Create a new user and save to the database
    const newUser = new User({ username });
    await newUser.save();

    // Respond with the saved user data
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contacts
app.get('/api/contactsfetch', async (req, res) => {
  try {
    const contacts = await User.find(); // Adjust the query to fetch specific fields if needed
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
