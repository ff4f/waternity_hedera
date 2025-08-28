import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';

const WellCommentsSection = ({ userRole = 'investor' }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Sarah Mitchell',
      role: 'investor',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      content: 'Great to see the project is ahead of schedule! The community impact metrics are impressive.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      likes: 5,
      replies: []
    },
    {
      id: 2,
      author: 'David Kimani',
      role: 'operator',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      content: 'Thank you for the support! We just completed the pump installation and water quality tests are excellent. The community is very excited.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      likes: 8,
      replies: [
        {
          id: 21,
          author: 'Maria Santos',
          role: 'investor',
          avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
          content: 'Fantastic work! Looking forward to the next milestone update.',
          timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
          likes: 2
        }
      ]
    },
    {
      id: 3,
      author: 'James Wilson',
      role: 'agent',
      avatar: 'https://randomuser.me/api/portraits/men/38.jpg',
      content: 'Milestone verification completed successfully. All documentation has been uploaded to IPFS and anchored on Hedera. Settlement calculations are ready for the next payout cycle.',
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      likes: 12,
      replies: []
    }
  ]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'investor':
        return 'text-success bg-success/10';
      case 'operator':
        return 'text-primary bg-primary/10';
      case 'agent':
        return 'text-secondary bg-secondary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'investor':
        return 'TrendingUp';
      case 'operator':
        return 'Settings';
      case 'agent':
        return 'Shield';
      default:
        return 'User';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment?.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const comment = {
        id: Date.now(),
        author: 'You',
        role: userRole,
        avatar: 'https://randomuser.me/api/portraits/men/50.jpg',
        content: newComment,
        timestamp: new Date(),
        likes: 0,
        replies: []
      };
      
      setComments([comment, ...comments]);
      setNewComment('');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleLike = (commentId, isReply = false, parentId = null) => {
    setComments(prevComments => 
      prevComments?.map(comment => {
        if (isReply && comment?.id === parentId) {
          return {
            ...comment,
            replies: comment?.replies?.map(reply => 
              reply?.id === commentId 
                ? { ...reply, likes: reply?.likes + 1 }
                : reply
            )
          };
        } else if (!isReply && comment?.id === commentId) {
          return { ...comment, likes: comment?.likes + 1 };
        }
        return comment;
      })
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Community Discussion</h3>
      {/* Comment Input */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Icon name={getRoleIcon(userRole)} size={16} className="text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <Input
              type="text"
              placeholder="Share your thoughts about this project..."
              value={newComment}
              onChange={(e) => setNewComment(e?.target?.value)}
              className="border-0 bg-card"
            />
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
                {userRole?.charAt(0)?.toUpperCase() + userRole?.slice(1)}
              </span>
              <Button
                variant="default"
                size="sm"
                loading={isSubmitting}
                onClick={handleSubmitComment}
                disabled={!newComment?.trim()}
                iconName="Send"
                iconPosition="right"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Comments List */}
      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment?.id} className="space-y-3">
            {/* Main Comment */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Image
                  src={comment?.avatar}
                  alt={comment?.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-foreground">{comment?.author}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment?.role)}`}>
                      {comment?.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment?.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">{comment?.content}</p>
                </div>
                <div className="flex items-center space-x-4 mt-2 ml-4">
                  <button
                    onClick={() => handleLike(comment?.id)}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-smooth"
                  >
                    <Icon name="Heart" size={14} />
                    <span className="text-sm">{comment?.likes}</span>
                  </button>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                    Reply
                  </button>
                </div>
              </div>
            </div>

            {/* Replies */}
            {comment?.replies?.length > 0 && (
              <div className="ml-12 space-y-3">
                {comment?.replies?.map((reply) => (
                  <div key={reply?.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Image
                        src={reply?.avatar}
                        alt={reply?.author}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{reply?.author}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(reply?.role)}`}>
                            {reply?.role}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(reply?.timestamp)}
                          </span>
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">{reply?.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 ml-3">
                        <button
                          onClick={() => handleLike(reply?.id, true, comment?.id)}
                          className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-smooth"
                        >
                          <Icon name="Heart" size={12} />
                          <span className="text-xs">{reply?.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Load More */}
      <div className="mt-6 text-center">
        <Button variant="outline" iconName="ChevronDown" iconPosition="right">
          Load More Comments
        </Button>
      </div>
    </div>
  );
};

export default WellCommentsSection;