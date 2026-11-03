export const SHOP_ITEMS = {
  Food: [
    {
      id: "catfood",
      name: "Kibble",
      price: 8,
      icon: "assets/food/kibble.png",
      description: "+6 Hunger",
      effects: {
        hunger: 6
      }
    },
    {
      id: "burger",
      name: "Burger",
      price: 15,
      icon: "assets/food/burger.png",
      description: "+8 Hunger, +2 Mood",
      effects: {
        hunger: 8,
        mood: 2
      }
    },
    {
      id: "pizzaSlice",
      name: "Pizza Slice",
      price: 15,
      icon: "assets/food/pizzaSlice.png",
      description: "+8 Hunger, +2 Mood",
      effects: {
        hunger: 8,
        mood: 2
      }
    },
    {
      id: "soda",
      name: "Can of Soda",
      price: 16,
      icon: "assets/food/soda.png",
      description: "+2 Hunger, +8 energy",
      effects: {
        hunger: 2,
        energy: 8
      }
    },
    {
      id: "sushi",
      name: "Sushi",
      price: 25,
      icon: "assets/food/sushi.png",
      description: "+15 Hunger, +5 Mood",
      effects: {
        hunger: 15,
        mood: 5
      }
    },
     {
      id: "magicPotion3",
      name: "Green Magic Potion",
      price: 99,
      icon: "assets/items/magicPotion3.png",
      description: "+75 hunger",
      effects: {
        hunger: 75,
      }
    }
  ],

  Toys: [
    {
      id: "pinkBall",
      name: "Pink ball",
      price: 8,
      icon: "assets/items/pinkBall.png",
      description: "+1 Social, +3 mood",
      effects: {
        mood: 3,
        social: 1
      }
    },
    {
      id: "stick",
      name: "Stick",
      price: 15,
      icon: "assets/items/stick.png",
      description: "+10 Social, +4 mood",
      effects: {
        mood: 4,
        social: 10
      }
    },
    {
      id: "mouse",
      name: "Toy Mouse",
      price: 25,
      icon: "assets/items/mouse.png",
      description: "+18 Social, +6 mood",
      effects: {
        mood: 6,
        social: 18
      }
    },
    {
      id: "tower",
      name: "Tower",
      price: 42,
      icon: "assets/items/tower.png",
      description: "+22 Social, +5 mood",
      effects: {
        mood: 5,
        social: 22
      }
    },
    {
      id: "magicPotion2",
      name: "Pink Magic Potion",
      price: 99,
      icon: "assets/items/magicPotion2.png",
      description: "+50 Social, +50 mood",
      effects: {
        mood: 50,
        social: 50
      }
    }
  ],
  Hygiene: [
    {
      id: "soap",
      name: "Soap",
      price: 6,
      icon: "assets/items/soap.png",
      description: "+5 Hygiene",
      effects: {
        hygiene: 5
      },
    },
    {
      id: "toothBrush",
      name: "Tooth Brush",
      price: 15,
      icon: "assets/items/toothBrush.png",
      description: "+12 Hygiene",
      effects: {
        hygiene: 12
      },
    },
    {
      id: "bed",
      name: "Basic Bed",
      price: 20,
      icon: "assets/items/CatBedBlue.png",
      description: "+15 Energy",
      effects: {
        energy: 15
      }
    },
    {
      id: "magicPotion1",
      name: "Blue Magic Potion",
      price: 99,
      icon: "assets/items/magicPotion1.png",
      description: "+50 Hygiene, +50 Energy",
      effects: {
        hygiene: 50,
        energy: 50
      }
    },
  ],

  Accessories: [],
  Decor: []
};