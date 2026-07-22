import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.schema';
import { Book } from '../books/book.schema';
import { Borrowing } from '../borrowings/borrowing.schema';
import { Review } from '../reviews/review.schema';
import { Author } from '../authors/author.schema';
import { Category } from '../categories/category.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Borrowing.name) private borrowingModel: Model<Borrowing>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const userCount = await this.userModel.countDocuments();
    if (userCount > 0) {
      this.logger.log('Database already seeded. Skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // Seed Users
    const hashedAdminPass = await bcrypt.hash('Admin123', 10);
    const hashedUserPass = await bcrypt.hash('User123', 10);

    const users = await this.userModel.insertMany([
      {
        name: 'Admin User',
        email: 'admin@bookmanager.com',
        password: hashedAdminPass,
        role: 'ADMIN',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedUserPass,
        role: 'MEMBER',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedUserPass,
        role: 'MEMBER',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: hashedUserPass,
        role: 'MEMBER',
      },
    ]);

        // Seed Categories
    const predefinedCategories = [
      'Programming', 'Technology', 'Science', 'Mathematics', 'History',
      'Biography', 'Fantasy', 'Romance', 'Mystery', 'Thriller',
      'Business', 'Psychology', 'Self Development', 'Education', 'Art', 'Health',
    ];
    await this.categoryModel.insertMany(
      predefinedCategories.map(name => ({ name }))
    );
    this.logger.log(`Created ${predefinedCategories.length} categories`);

    // Seed Authors
    const authorNames = [
      'Robert C. Martin', 'Andrew Hunt', 'David Thomas', 'Erich Gamma',
      'Richard Helm', 'Ralph Johnson', 'John Vlissides', 'James Clear',
      'J.K. Rowling', 'J.R.R. Tolkien', 'Harper Lee', 'George Orwell',
      'F. Scott Fitzgerald', 'Yuval Noah Harari', 'Thomas H. Cormen',
      'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein',
      'Paulo Coelho', 'Eric Ries', 'Sun Tzu', 'J.D. Salinger',
      'Daniel Kahneman', 'Homer', 'Dan Brown', 'Stephen R. Covey',
      'Jane Austen', 'Morgan Housel', 'Charles Duhigg', 'Tara Westover',
    ];
    const uniqueAuthors = [...new Set(authorNames)];
    const authorDocs = await this.authorModel.insertMany(
      uniqueAuthors.map(name => ({ name, biography: `${name} is an author.` }))
    );
    this.logger.log(`Created ${authorDocs.length} authors`);

    // Seed Books
    const books = await this.bookModel.insertMany([
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn\'t have to be that way. This book covers principles, patterns, and practices of writing clean code.',
        ISBN: '978-0132350884',
        category: 'Technology',
        publicationYear: 2008,
        coverImage: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'The Pragmatic Programmer: Your Journey to Mastery',
        author: 'Andrew Hunt, David Thomas',
        description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years. Whether you\'re a new developer, an experienced developer, or a manager responsible for developer teams, this book will help you understand the process of developing software.',
        ISBN: '978-0135957059',
        category: 'Technology',
        publicationYear: 2019,
        coverImage: 'https://m.media-amazon.com/images/I/41as+WafrFL._SX380_BO1,204,203,200_.jpg',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
        ISBN: '978-0201633610',
        category: 'Technology',
        publicationYear: 1994,
        coverImage: 'https://m.media-amazon.com/images/I/51kuc0iWoKL._SX395_BO1,204,203,200_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
        author: 'James Clear',
        description: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
        ISBN: '978-0735211292',
        category: 'Self-Help',
        publicationYear: 2018,
        coverImage: 'https://m.media-amazon.com/images/I/51-nXsSRfZL._SX328_BO1,204,203,200_.jpg',
        totalCopies: 6,
        availableCopies: 6,
      },
      {
        title: 'Harry Potter and the Sorcerer\'s Stone',
        author: 'J.K. Rowling',
        description: 'Harry Potter has never been the star of a Quidditch team, scoring points while riding a broom far above the ground. He knows no spells, has never helped to hatch a dragon, and has never worn a cloak of invisibility. All he knows is a miserable life with the Dursleys, his horrible aunt and uncle, and their abominable son, Dudley.',
        ISBN: '978-0439708180',
        category: 'Fiction',
        publicationYear: 1997,
        coverImage: 'https://m.media-amazon.com/images/I/51UoqRAxwEL._SX331_BO1,204,203,200_.jpg',
        totalCopies: 8,
        availableCopies: 8,
      },
      {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to whisk him away on an adventure.',
        ISBN: '978-0547928227',
        category: 'Fiction',
        publicationYear: 1937,
        coverImage: 'https://m.media-amazon.com/images/I/510J2NPz5jL._SX331_BO1,204,203,200_.jpg',
        totalCopies: 7,
        availableCopies: 7,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Through the young eyes of Scout and Jem Finch, Harper Lee explores with rich humor and unswerving honesty the irrationality of adult attitudes toward race and class.',
        ISBN: '978-0061120084',
        category: 'Fiction',
        publicationYear: 1960,
        coverImage: 'https://m.media-amazon.com/images/I/51Zs4vKhGXL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'Among the seminal texts of the 20th century, this dystopian novel is a cautionary tale about the future of totalitarianism. Winston Smith, a low-ranking party member, begins to rebel against the all-seeing eye of Big Brother and the oppressive regime of the Party.',
        ISBN: '978-0451524935',
        category: 'Fiction',
        publicationYear: 1949,
        coverImage: 'https://m.media-amazon.com/images/I/41aM4xOZxaL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 6,
        availableCopies: 6,
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when the New York Times noted "encroachments of the newer and grander" money.',
        ISBN: '978-0743273565',
        category: 'Fiction',
        publicationYear: 1925,
        coverImage: 'https://m.media-amazon.com/images/I/41o2GEcN2CL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be "human."',
        ISBN: '978-0062316110',
        category: 'History',
        publicationYear: 2015,
        coverImage: 'https://m.media-amazon.com/images/I/51u1hF3FnkL._SX329_BO1,204,203,200_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        description: 'A comprehensive textbook covering a wide range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers. Each chapter is relatively self-contained and can be used as a unit of study.',
        ISBN: '978-0262033848',
        category: 'Technology',
        publicationYear: 2009,
        coverImage: 'https://m.media-amazon.com/images/I/41VndKVtiXL._SX440_BO1,204,203,200_.jpg',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        description: 'Paulo Coelho\'s enchanting novel has inspired a devoted following around the world. This story, dazzling in its powerful simplicity and soul-stirring wisdom, is about an Andalusian shepherd boy named Santiago who travels from his homeland in Spain to the Egyptian desert in search of a treasure buried in the Pyramids.',
        ISBN: '978-0062315007',
        category: 'Fiction',
        publicationYear: 1988,
        coverImage: 'https://m.media-amazon.com/images/I/51Z0nLAfLIL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation',
        author: 'Eric Ries',
        description: 'Most startups fail. But many of those failures are preventable. The Lean Startup is a new approach being adopted across the globe, changing the way companies are built and new products are launched.',
        ISBN: '978-0307887894',
        category: 'Business',
        publicationYear: 2011,
        coverImage: 'https://m.media-amazon.com/images/I/51T-sMqSMiL._SX329_BO1,204,203,200_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'The Art of War',
        author: 'Sun Tzu',
        description: 'The Art of War is an ancient Chinese military treatise dating from the Late Spring and Autumn Period. The work is attributed to the ancient Chinese military strategist Sun Tzu. The text is composed of 13 chapters, each devoted to an aspect of warfare.',
        ISBN: '978-1590302255',
        category: 'Philosophy',
        publicationYear: 500,
        coverImage: 'https://m.media-amazon.com/images/I/41wTj4xGd4L._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        description: 'The hero-narrator of this novel, Holden Caulfield, is an ancient child of sixteen, a native New Yorker, who has been expelled from an exclusive prep school. His story is told in a monologue that is both heartwarming and heartbreaking.',
        ISBN: '978-0316769488',
        category: 'Fiction',
        publicationYear: 1951,
        coverImage: 'https://m.media-amazon.com/images/I/51E6ZzUyz+L._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        description: 'In the highly anticipated Thinking, Fast and Slow, Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.',
        ISBN: '978-0374533557',
        category: 'Psychology',
        publicationYear: 2011,
        coverImage: 'https://m.media-amazon.com/images/I/41iH0XJqB-L._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Odyssey',
        author: 'Homer',
        description: 'The Odyssey is one of two major ancient Greek epic poems attributed to Homer. It is one of the oldest works of literature still widely read by modern audiences. The poem is the story of Odysseus, king of Ithaca, who wanders for 10 years trying to get home after the Trojan War.',
        ISBN: '978-0140268867',
        category: 'Classics',
        publicationYear: -800,
        coverImage: 'https://m.media-amazon.com/images/I/51Fm0E6oPLL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        description: 'While in Paris on business, Harvard symbologist Robert Langdon receives an urgent late-night phone call: the elderly curator of the Louvre has been murdered inside the museum. Near the body, police have found a baffling cipher.',
        ISBN: '978-0307474278',
        category: 'Mystery',
        publicationYear: 2003,
        coverImage: 'https://m.media-amazon.com/images/I/51CApxDzGKL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 6,
        availableCopies: 6,
      },
      {
        title: 'The 7 Habits of Highly Effective People',
        author: 'Stephen R. Covey',
        description: 'This is a principle-centered approach for solving personal and professional problems. With penetrating insights and pointed anecdotes, Covey reveals a step-by-step pathway for living with fairness, integrity, honesty, and human dignity.',
        ISBN: '978-1982137274',
        category: 'Self-Help',
        publicationYear: 1989,
        coverImage: 'https://m.media-amazon.com/images/I/51Q2zM5KgdL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language. The story follows the main character, Elizabeth Bennet, as she deals with issues of manners, upbringing, morality, education, and marriage.',
        ISBN: '978-0141439518',
        category: 'Fiction',
        publicationYear: 1813,
        coverImage: 'https://m.media-amazon.com/images/I/51Q+UZN4MQL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        description: 'One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them. In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others.',
        ISBN: '978-0544003415',
        category: 'Fiction',
        publicationYear: 1954,
        coverImage: 'https://m.media-amazon.com/images/I/51V3Wn06BaL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        description: 'Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people. In this book, Morgan Housel shares 19 short stories exploring the strange ways people think about money.',
        ISBN: '978-0857197689',
        category: 'Business',
        publicationYear: 2020,
        coverImage: 'https://m.media-amazon.com/images/I/41fdr8V5HXL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        description: 'In The Power of Habit, award-winning business reporter Charles Duhigg takes us to the thrilling edge of scientific discoveries that explain why habits exist and how they can be changed.',
        ISBN: '978-0812981605',
        category: 'Self-Help',
        publicationYear: 2012,
        coverImage: 'https://m.media-amazon.com/images/I/51ejXdSceNL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Educated: A Memoir',
        author: 'Tara Westover',
        description: 'An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University. Educated is an account of the struggle for self-invention.',
        ISBN: '978-0399590504',
        category: 'Biography',
        publicationYear: 2018,
        coverImage: 'https://m.media-amazon.com/images/I/51zUgt+r2sL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
        totalCopies: 3,
        availableCopies: 3,
      },
    ]);

    // Seed Borrowings
    const today = new Date();
    const borrowings = await this.borrowingModel.insertMany([
      {
        userId: users[1]._id,
        bookId: books[0]._id,
        borrowDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        returnDate: null,
        status: 'BORROWED',
      },
      {
        userId: users[1]._id,
        bookId: books[3]._id,
        borrowDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
        returnDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
      },
      {
        userId: users[2]._id,
        bookId: books[4]._id,
        borrowDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        returnDate: null,
        status: 'BORROWED',
      },
      {
        userId: users[2]._id,
        bookId: books[5]._id,
        borrowDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        returnDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
      },
      {
        userId: users[3]._id,
        bookId: books[0]._id,
        borrowDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        returnDate: new Date(today.getTime() - 23 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
      },
    ]);

    // Update available copies for currently borrowed books
    await this.bookModel.findByIdAndUpdate(books[0]._id, { $inc: { availableCopies: -1 } });
    await this.bookModel.findByIdAndUpdate(books[4]._id, { $inc: { availableCopies: -1 } });

    // Seed Reviews
    await this.reviewModel.insertMany([
      {
        userId: users[1]._id,
        bookId: books[0]._id,
        rating: 5,
        comment: 'Excellent book! Every developer should read this.',
      },
      {
        userId: users[2]._id,
        bookId: books[0]._id,
        rating: 4,
        comment: 'Great principles, some parts are a bit dated.',
      },
      {
        userId: users[3]._id,
        bookId: books[0]._id,
        rating: 5,
        comment: 'Changed the way I write code forever.',
      },
      {
        userId: users[1]._id,
        bookId: books[3]._id,
        rating: 5,
        comment: 'Life-changing book on habits.',
      },
      {
        userId: users[2]._id,
        bookId: books[4]._id,
        rating: 5,
        comment: 'Magical! A must-read for all ages.',
      },
      {
        userId: users[1]._id,
        bookId: books[5]._id,
        rating: 5,
        comment: 'The start of an incredible journey.',
      },
      {
        userId: users[3]._id,
        bookId: books[1]._id,
        rating: 4,
        comment: 'Very practical advice for developers.',
      },
    ]);

    this.logger.log('Database seeded successfully!');
    this.logger.log(`Created ${users.length} users`);
    this.logger.log(`Created ${books.length} books`);
    this.logger.log(`Created ${borrowings.length} borrowings`);
  }
}
