# 🍏 Apple Store Data Viewer

![Apple Store Data Viewer](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

A beautiful, responsive web application that displays and helps explore Apple Store app data with an elegant green-themed UI. This project demonstrates practical data visualization techniques using pure HTML, CSS, and JavaScript.

## ✨ Features

- **Modern UI**: Clean, responsive interface with green theme and card-based layout
- **Live Search**: Instantly filter apps by name or genre as you type
- **Visual Ratings**: Star-based visual representation of app ratings
- **Performance Optimized**: Fast loading and parsing of CSV data
- **Mobile Friendly**: Responsive design works on all device sizes
- **Zero Dependencies**: Built with vanilla HTML, CSS, and JavaScript - no frameworks required!

## 📱 Screenshots

![App Screenshot Placeholder](https://via.placeholder.com/800x400?text=Apple+Store+Data+Viewer)

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic knowledge of command-line tools

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/apple-store-data-viewer.git
   cd apple-store-data-viewer
   ```

2. No additional installation required! This project uses pure HTML, CSS, and JavaScript.

### Running the App

Method 1: Using Python's built-in HTTP server (recommended):

```bash
python3 -m http.server 8000
```

Then open your browser and navigate to: `http://localhost:8000`

Method 2: Simply open `index.html` in your browser (may have limitations with CSV loading due to CORS policies).

## 🛠️ Project Structure

```
apple-store-data-viewer/
├── index.html           # Main HTML structure
├── styles.css           # CSS styling with green theme
├── script.js            # JavaScript for data loading and UI interaction
├── AppleStore.csv       # CSV data source containing Apple Store app information
└── README.md            # Project documentation
```

## 🔍 How It Works

1. **Data Loading**: The app fetches and parses the CSV data from `AppleStore.csv` using vanilla JavaScript
2. **Data Processing**: The raw CSV data is converted into structured objects for easy manipulation
3. **Rendering**: The first 50 apps are displayed in a responsive grid layout with their details
4. **Interaction**: Users can search through the apps by typing in the search box, with results updating in real-time

## 🧩 Technical Details

### CSV Parsing

The application implements a custom CSV parser that properly handles quoted fields and comma separators within fields, ensuring accurate data extraction.

### Responsive Design

The UI is built with a mobile-first approach, using CSS Grid and Flexbox to ensure proper display across all device sizes.

### Search Functionality

The search feature filters apps by both name and genre, updating results in real-time as the user types without page reloads.

## 🔮 Future Enhancements

This project can be extended with:

- Sorting capabilities (by price, rating, or name)
- Detailed view for each app
- Data visualization/charts for app statistics
- Pagination or infinite scrolling for viewing more apps
- Advanced filtering options

## 👥 Team Structure

This project is structured for a team of 3 members, each responsible for specific tasks:

1. **Team Member 1**: Basic structure, UI, and data loading
2. **Team Member 2**: Search functionality and sorting options
3. **Team Member 3**: Detailed app view and data visualization

Each team member works with both Jira for task tracking and GitHub for version control.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

Project Link: [https://github.com/yourusername/apple-store-data-viewer](https://github.com/yourusername/apple-store-data-viewer)

---

Made with ❤️ and pure web technologies
