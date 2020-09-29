const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const TokenError = require('../errors/TokenError');
const ConflictError = require('../errors/ConflictError');

module.exports.getAllUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.send({ data: users }))
    .catch(next);
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params._id)
    .orFail()
    .catch(() => {
      throw new NotFoundError({ message: `Пользователь с идентификатором ${req.params.id} не найден` });
    })
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then((hash) => User.create({
      email: req.body.email,
      password: hash,
      name: req.body.name ? req.body.name : undefined,
      avatar: req.body.avatar ? req.body.avatar : undefined,
      about: req.body.about ? req.body.about : undefined,
    }))
    .catch((err) => {
      if (err.name === 'MongoError') {
        throw new ConflictError({ message: 'Пользователь с таким email уже существует' });
      }
      throw new BadRequestError({ message: `Запрос некорректен: ${err.message}` });
    })
    .then((user) => {
      res.send({
        data: {
          _id: user._id,
          email: user.email,
          name: user.name ? user.name : undefined,
          avatar: user.avatar ? user.avatar : undefined,
          about: user.about ? user.about : undefined,
        },
      });
    })
    .catch(next);
};

module.exports.updateUser = (req, res, next) => {
  const { name, about } = req.body;
  const currentOwner = req.user._id;
  User.findByIdAndUpdate(req.user._id,
    { name, about },
    {
      new: true,
      runValidators: true,
    })
    .orFail()
    .catch((err) => {
      if (err instanceof NotFoundError) {
        throw err;
      }
      throw new BadRequestError({ message: `Запрос некорректен: ${err.message}` });
    })
    .then((updatedUser) => {
      if (currentOwner !== updatedUser._id) {
        throw new BadRequestError({ message: 'Запрос некорректен' });
      }
      res.send({ data: updatedUser });
    })
    .catch(next);
};

module.exports.updateAvatar = (req, res, next) => {
  const { avatar } = req.body;

  User.findByIdAndUpdate(req.user._id,
    { avatar },
    {
      new: true,
      runValidators: true,
    })
    .orFail()
    .catch((err) => {
      if (err instanceof NotFoundError) {
        throw err;
      }
      throw new BadRequestError({ message: `Запрос некорректен: ${err.message}` });
    })
    .then((updatedAvatar) => res.send({ data: updatedAvatar }))
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .catch(() => {
      throw new TokenError({ message: `Пользователь с идентификатором ${req.body.email} не найден` });
    })
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        'some-secret-key',
        { expiresIn: '7d' },
      );
      res.send({ token });
    })
    .catch(next);
};
