**Movie Database API**


**Installation and Setup**

Clone the repository.

Run npm install to install the dependencies.

Start MongoDB service like it was deployed in my cluster on: https://cloud.mongodb.com/v2/64db7c2eca6b6802df3614af#/metrics/replicaSet/64db7cbc72739243f97a132a/explorer/movies/genres/find

Run npm start to start the application.

**Features**

User Authentication: Secure user authentication is implemented using JWT tokens.

Data Validation: The project makes use of express-validator to ensure that only valid data is saved to the database.

Data Relations: Movies are linked with genres and directors, allowing for complex queries.

Logging: Detailed logging is enabled for debugging purposes.

Error Handling: Proper error responses are sent to the client, making it easier to trace issues.

**Tech Stack**

Node.js for the runtime environment.
Express.js for building the RESTful API.
MongoDB as the database.
Mongoose for object data modeling.
Passport.js for user authentication.
bcrypt for password hashing.
JWT for generating and verifying JSON Web Tokens.



**API Endpoints:**


**User Routes:**

Create User: POST /users

Get All Users: GET /users

Update User: PUT /users/:username

Delete User: DELETE /users/:username


**Movie Routes:**

Get All Movies: GET /movies

Get Movie By Title: GET /movies/:title


**Genre Routes:**

Get Genre By Name: GET /genres/:genreName


**Usage**

All routes except user creation require authentication.
Contributing
Feel free to fork the repository and submit pull requests.

**Contact**

Email: l.lvisor@hotmail.it

GitHub: https://github.com/DarkVisor5
