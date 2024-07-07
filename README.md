# Chinese Roofs

Расширение для VSCode. Формат файла - `.chr`. Для личного пользования.

## Демонстрация

Одно слово:

![Слово](./images/example-0.jpg)

Переведенный текст и словарь:

![Переведенный текст и словарь](./images/example-1.jpg)

Подсказки от БКРС:

![Подсказки от БКРС](./images/example-2.gif)

## Дополнительная конфигурация темы

```json
{
  {
    "scope": ["translation.text.chr"],
    "settings": {/* ... */}
  },
  {
    "scope": ["translation.vocabulary.word.original.chr"],
    "settings": {/* ... */}
  },
  {
    "scope": ["translation.vocabulary.word.pinyin.chr"],
    "settings": {/* ... */}
  },
  {
    "scope": "translation.vocabulary.word.pinyin.char.chr",
    "settings": {/* ... */}
  },
  {
    "scope": "translation.vocabulary.word.pinyin.tone.chr",
    "settings": {/* ... */}
  },
  {
    "scope": "translation.vocabulary.word.translation.chr",
    "settings": {/* ... */}
  }
}
```
