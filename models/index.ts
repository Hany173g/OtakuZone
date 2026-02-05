// Import all models to ensure schemas are registered
// This file must be imported before using populate() in any file

import User from './User'
import Category from './Category'
import Topic from './Topic'
import Comment from './Comment'
import Like from './Like'
import Follow from './Follow'
import Notification from './Notification'
import Rating from './Rating'
import Anime from './Anime'
import Ad from './Ad'
import Dislike from './Dislike'
import TopicView from './TopicView'
import UserFollow from './UserFollow'
import Group from './Group'
import GroupMember from './GroupMember'
import GroupTopic from './GroupTopic'
import GroupComment from './GroupComment'
import GroupLog from './GroupLog'
import Favorite from './Favorite'

// Export all models
export {
  User,
  Category,
  Topic,
  Comment,
  Like,
  Dislike,
  Follow,
  Notification,
  Rating,
  Anime,
  Ad,
  TopicView,
  UserFollow,
  Group,
  GroupMember,
  GroupTopic,
  GroupComment,
  GroupLog,
  Favorite,
}

// This ensures all models are registered before any populate() calls
export default {
  User,
  Category,
  Topic,
  Comment,
  Like,
  Dislike,
  Follow,
  Notification,
  Rating,
  Anime,
  Ad,
  TopicView,
  UserFollow,
  Group,
  GroupMember,
  GroupTopic,
  GroupComment,
  GroupLog,
  Favorite,
}

