export const createYSlice = (set) => ({
  news: [],
  recommends: [],
  posts: [],
  getNews: async () => {
    // mock data
    set({
      news: [
        {
          topic: 'COVID 19',
          pubtime: 'Last night',
          title: 'England\'s Chief Medical Officer says the UK is at the most dangerous time of the pandemic',
          thumbnail: 'https://imgur.com/fe6Os7p.jpg',
          trendingTag: 'covid19',
          href: '/y',
        }, {
          topic: 'mock news',
          pubtime: '1 minute ago',
          title: 'Test content',
          thumbnail: 'https://imgur.com/LEZh7UN.jpg',
          trendingTag: 'test',
          href: '/y',
        }
      ]
    });
  },
  getRecommends: async () => {
    // mock data
    set({
      recommends: [
        {
          userId: '1',
          username: 'Bessie Cooper',
          photoURL: '',
          description: 'unknow'
        }, {
          userId: '2',
          username: 'user 1',
          photoURL: '',
          description: 'unknow'
        }
      ]
    });
  },
  getPosts: async () => {
    // mock data
    set((state) => ({
      posts: [
        ...state.posts,
        {
          id: 1,
          userId: '1',
          username: 'Devon Lane',
          photoURL: '',
          pubtime: '2023-09-09',
          content: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            photosURL: ['https://imgur.com/fe6Os7p.jpg']
          },
          comments: [{
            userId: 'xxx',
            username: 'user x',
            photoURL: '',
            comment: 'test comments',
            pubtime: '2023-09-09'
          }],
          liked: 20
        },
        {
          id: 2,
          userId: '2',
          username: 'Devon Lane',
          photoURL: '',
          pubtime: '2023-09-09',
          content: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            photosURL: ['https://imgur.com/fe6Os7p.jpg']
          },
          comments: [{
            userId: 'xxx',
            username: 'user x',
            photoURL: '',
            comment: 'test comments',
            pubtime: '2023-09-09'
          }],
          liked: 20
        },
        {
          id: 3,
          userId: '3',
          username: 'Devon Lane',
          photoURL: '',
          pubtime: '2023-09-09',
          content: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            photosURL: ['https://imgur.com/fe6Os7p.jpg']
          },
          comments: [{
            userId: 'xxx',
            username: 'user x',
            photoURL: '',
            comment: 'test comments',
            pubtime: '2023-09-09'
          }],
          liked: 20
        },
        {
          id: 4,
          userId: '4',
          username: 'Devon Lane',
          photoURL: '',
          pubtime: '2023-09-09',
          content: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            photosURL: ['https://imgur.com/fe6Os7p.jpg']
          },
          comments: [{
            userId: 'xxx',
            username: 'user x',
            photoURL: '',
            comment: 'test comments',
            pubtime: '2023-09-09'
          }],
          liked: 20
        },
        {
          id: 5,
          userId: '5',
          username: 'Devon Lane',
          photoURL: '',
          pubtime: '2023-09-09',
          content: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            photosURL: ['https://imgur.com/fe6Os7p.jpg']
          },
          comments: [{
            userId: 'xxx',
            username: 'user x',
            photoURL: '',
            comment: 'test comments',
            pubtime: '2023-09-09'
          }],
          liked: 20
        }
      ]
    }))
  },
  handleFollow: (user) => {
    // todo
    console.log('click following: ' + user.username);
  },
  handleSearch: (value) => {
    // todo
    console.log('search '+ value);
  },
  handlePost: (content) => {
    console.log('post ' + content);
  },
  handleComment: () => {

  },
  handleLike: () => {

  }
})
