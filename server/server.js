const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'EV_cars_excel.xlsx');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Set up Sequelize with SQLite for the first database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// Define a model for the first database
const Car = sequelize.define('Car', {
  battery: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  car_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  car_name_link: {
    type: DataTypes.STRING,
    allowNull: false
  },
  efficiency: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  fast_charge: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  range: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  top_speed: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  acceleration: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

// Sync the model with the database
sequelize.sync();

// Set up Sequelize with SQLite for the second database
const secondSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'second_database.sqlite'
});

// Define a model for the second database
const ElectricityData = secondSequelize.define('ElectricityData', {
  sales: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  revenue: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  customers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sectorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stateDescription: {
    type: DataTypes.STRING,
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Sync the model with the second database
secondSequelize.sync();

// Endpoint to load data from Excel file to the first database
app.get('/api/load-data', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'EV_cars_excel.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Clear existing data
    await Car.destroy({ where: {}, truncate: true });

    // Insert new data
    for (const item of data) {
      await Car.create({
        battery: item.Battery,
        car_name: item.Car_name,
        car_name_link: item.Car_name_link,
        efficiency: item.Efficiency,
        fast_charge: item.Fast_charge,
        price: item.Price,
        range: item.Range,
        top_speed: item.Top_speed,
        acceleration: item.Acceleration
      });
    }

    res.status(200).json({ message: 'Data loaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to get data from the first database
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.findAll();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a car in the first database
app.post('/api/cars', async (req, res) => {
  try {
    const { battery, car_name, car_name_link, efficiency, fast_charge, price, range, top_speed, acceleration } = req.body;
    const newCar = await Car.create({ battery, car_name, car_name_link, efficiency, fast_charge, price, range, top_speed, acceleration });
    console.log("new car in post api/cars : ", newCar);
    res.status(201).json(newCar);
    console.log("new car in post api/cars json: ", newCar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific car from the first database
app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a car in the first database
app.put('/api/cars/:id', async (req, res) => {
  try {
    const { battery, car_name, car_name_link, efficiency, fast_charge, price, range, top_speed, acceleration } = req.body;
    const [updated] = await Car.update({ battery, car_name, car_name_link, efficiency, fast_charge, price, range, top_speed, acceleration }, { where: { id: req.params.id } });
    console.log("in put /api/cars/:id")
    if (updated) {
      const updatedCar = await Car.findByPk(req.params.id);
      res.json(updatedCar);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a car from the first database
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const deleted = await Car.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


///-------------------------------electricity-------------------------------
// Endpoint to load data from Excel file to the second database
app.get('/api/load-electricity-data', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'Electricity.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Clear existing data
    await ElectricityData.destroy({ where: {}, truncate: true });

    // Insert new data
    for (const item of data) {
      // Check if the required fields are present and not null
      if (item.sales !== undefined && item.revenue !== undefined && item.price !== undefined &&
          item.customers !== undefined && item.sectorName === 'residential' &&
          item.stateDescription !== undefined && item.month !== undefined && item.year !== undefined) {
        await ElectricityData.create({
          sales: item.sales,
          revenue: item.revenue,
          price: item.price,
          customers: item.customers,
          sectorName: item.sectorName,
          stateDescription: item.stateDescription,
          month: item.month,
          year: item.year
        });
      } else {
        console.warn('Skipping row due to missing data or non-residential sector:', item);
      }
    }

    res.status(200).json({ message: 'Electricity data loaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to get electricity data
app.get('/api/electricity-data', async (req, res) => {
  try {
    const electricityData = await ElectricityData.findAll();
    res.json(electricityData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API endpoint to get the electricity price for a specific country or state
app.get('/api/electricity-price/:state', (req, res) => {
  const { state } = req.params;

  electricityDb.get('SELECT price FROM electricity WHERE stateDescription = ?', [state], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json({ price: row.price });
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});