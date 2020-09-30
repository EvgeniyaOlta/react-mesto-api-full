const Card = require('../models/card');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const DeleteCardError = require('../errors/DeleteCardError');

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;

  Card.create({ name, link, owner: req.user._id })
    .catch((err) => {
      throw new BadRequestError({ message: `Запрос некорректен: ${err.message}` });
    })
    .then((card) => res.send({ data: card }))
    .catch(next);
};

module.exports.getAllCards = (req, res, next) => {
  Card.find({})
    .populate('user')
    .then((cards) => res.send({ data: cards }))
    .catch(next);
};

module.exports.deleteCard = (req, res, next) => {
  const currentOwner = req.user._id;
  Card.findByIdAndDelete(req.params._id)
    .then((card) => {
      if (card.owner !== currentOwner) {
        throw new DeleteCardError({ message: 'Запрос некорректен: недостаточно прав' });
      }
      if (!card) {
        throw new NotFoundError({ message: `Kарточка с идентификатором ${req.params.id} не найдена` });
      }
      res.send({ data: card });
    })
    .catch(next);
};

module.exports.likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params._id,
    { $addToSet: { likes: req.user._id } },
    { new: true })
    .orFail()
    .catch(() => {
      throw new NotFoundError({ message: `Kарточка с идентификатором ${req.params.id} не найдена` });
    })
    .then((likes) => res.send({ data: likes }))
    .catch(next);
};

module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params._id,
    { $pull: { likes: req.user._id } },
    { new: true })
    .orFail()
    .catch(() => {
      throw new NotFoundError({ message: `Kарточка с идентификатором ${req.params.id} не найдена` });
    })
    .then((likes) => res.send({ data: likes }))
    .catch(next);
};
