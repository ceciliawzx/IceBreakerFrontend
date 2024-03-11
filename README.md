## General Purpose

### General background

- Every year, newly admitted undergraduate students at the Department
of Computing are assigned a personal tutor (PT). A small number of
students can be part of the same PT group. PT groups meet for the first
time at the beginning of their first term. To facilitate this process,
I(the tutor) have been using an ice-breaker game aiming to help tutees
to get to know each other and their tutor.

### Project goal

- to transform the physical game into “pervasive”. That is, we assume
participants will still be either physically present in the same room or
connected through a video conference. The project should produce a
website to support the ice-breaker game. In particular, participants of
the same PT group and their tutor should be able to use it to input
information and introduce each other in a fun way. The system should
also allow participants to have access to the produced information after
the end of the game.

### Target user

- personal tutors and first year undergraduate students.

## Game Procedure:

### Procedure description

1. **An ice-breaker game can be hosted with:**
    1. a **moderator** —— can view participants’ profiles and
    manage the whole game process including changing presenter, starting
    presenting, setting gaming time limit, etc.
    2. two or more **participants**
    3. Everyone will see an instruction telling what to do in each page
    except for the Homepage . The instructions can be view again by clicking
    the green circle “i” on the top left of each page!
2. **To start an ice-breaker game**
    1. A person who create a room by entering a display name will become
    the **moderator** of the game. A room code will be
    presented on top of the page called *wait room*, which should be
    shared with other participants.
    2. Entering the room code and display name, the others can join in the
    room created by the moderator, and become
    **participants.**
3. **Wait room:**
    1. Everyone fills in information
        - Mandatory
            1. First name
            2. Last name
            3. City
            4. Country
            5. Current Feeling
            6. Favourite food
            7. Favourite activities
        - Optional:
            1. Selfie
    2. **Moderator** can:
        1. Select **presenter**
        2. View everyone’s profile anytime
        3. Kick anyone
        4. Start presenting when everyone filling in all the information
        needed.
        5. Ring those who haven’t completed filling information to tell them to
        wrap it up
    3. Indicator —— next to the selfie
        1. A green dot indicates information completed.
        2. A blue dot indicates presented
    4. Once everyone completed, **moderator** can start
    presenting with the chosen **presenter** and will enter
    *present room*.
    5. Once all participants have presented, the ice-breaker game will
    automatically finish and direct to *all-presented* page.
        1. **Moderator** can finish the game with no
        conditions.
    6. Everyone can leave room
        1. If **Moderator** leaves, the room will be
        dismissed.
4. **Present room:**
    1. The details of the **presenter**’s information are
    hidden.
    2. **Presenter** can choose to play which game for
    revealing each information
    3. **Moderator** can reveal fields in behalf of the
    presenter to control the flow of presentation
    4. Once all fields are revealed, **moderator** can click
    “Back to wait room” to direct back to *wait room*, and choose
    another presenter.
5. **Games:**
    1. Reveal directly without playing
    2. Geoguesser (Only for City/Country)
    3. Wordle (Only for short word)
    4. Hangman (Only for word and phrase)
    5. Draw&Guess
    6. Share board
6. **All presented page:**
    1. This is the final page
    2. Everyone can view others’ profile and export in PDF
        1. Export each in separate
        2. Export all in one
    3. Each participants will receive a similarity reports comparing their
    information with others.
    4. If **moderator** clicks “Back to Homepage”, the room
    will be dismissed

### Page linking graph
<img src="./img/page-linking-graph.png?raw=true" width="800"/>

### Instruction graphs

- **Wait Room**
    <img src="./img/WaitRoom.png?raw=true" width="600"/>

- **Present Room**
    <img src="./img/PresentRoom.png?raw=true" width="600"/>
    
- **Pictionary Game**
    <img src="./img/PictionaryGame.png?raw=true" width="600"/>
    
- **Shareboard Game**
    <img src="./img/ShareboardGame.png?raw=true" width="600"/>
    
- **GeoGuesser Game**
    <img src="./img/GeoguesserGame1.png?raw=true" width="600"/>

    <img src="./img/GeoguesserGame2.png?raw=true" width="600"/>
    

- **Wordle Game**
    <img src="./img/WordleGame.png?raw=true" width="600"/>
    
- **Hangman Game**
    <img src="./img/HangmanGame.png?raw=true" width="600"/>
    

## How to Use

### Current Deployed version

- You can access the current deployed version of the website via the
url: https://www.doc.ic.ac.uk/project/2023/60021/g236002112/web/

### Access project Git repositories

- Front-end
    
    https://gitlab.doc.ic.ac.uk/g236002112/icebreakweb.git
    
- Back-end
    
    https://gitlab.doc.ic.ac.uk/g236002112/icebreakerbackend.git
    
- Similarity-Analyser
    
    [https://gitlab.doc.ic.ac.uk/g236002112/icebreakeranalysis.git](https://gitlab.doc.ic.ac.uk/g236002112/icebreakeranalysis)
    

### Start front-end

1. **Prerequisites:**
    - npm 10.1.0 or above
2. **Install dependency:**
    
    ```bash
    npm install
    ```
    
    Install front-end dependency packages.
    
3. **Run on local machine:**
    
    ```bash
    npm run build
    ```
    
    Builds the app for production to the `build` folder.
    
    ```bash
    npm start
    ```
    
    Runs the app in the development mode.
    
    Open [http://localhost:3000](http://localhost:3000/) to
    view it in the browser.
    
    The page will reload if you make edits.
    
    You will also see any lint errors in the console.
    
4. **Connect with backend:**
    
    In front-end, open `src/macro/MacroServer.tsx` , change
    the serverPort and websocketPort to your back-end server url.
    
    ```tsx
    export const serverPort = "https://YOUR_SERVER_URL:PORT_NUMBER";
    export const websocketPort = "wss://YOUR_SERVER_URL:PORT_NUMBER";
    ```
    

### Start back-end

1. **Prerequisites:**
    - Java 17
    - maven 3.8
2. **To run the app locally:** 
    
    please remove all
    `server.ssl` variables in the file `application.properties`
    (This will remove the ssl certificate and serve the app over http
    instead of https)
    
    The `[application.properties](http://application.properties)` file should look like this when running the app locally:
    
    ```bash
    server.port=8080
    ```
    
3. **Install dependency, build and run unit tests:**
(`DskipITs` flag is used to skip Integration test, as they
are end2end tests)
    
    ```bash
    mvn clean install -DskipITs
    ```
    
    Install backend-end dependency packages.
    
4. **Run on local machine after build**. 
    
    By default, this will run the
    app on localhost:8080. In order to customize the port, please change
    `server.port` variable in the file
    `application.properties`
    
    ```bash
    java -jar target/IceBreakerBackend-1.0.jar
    ```
    

### Start similarity analyser

1. **Prerequisites:**
    - Python 3.11
2. **Install dependency:**
    
    ```bash
    python3 install -r requirements.txt
    ```
    
3. **Run unit tests:**
    
    ```bash
    pytest
    ```
    
4. **Run the analyzer on local machine:** 
    
    By default, this will run serve the analyzer app over localhost:8000. 
    
    In order to customize the port, please change the 8000 in the line `app.run(port=8000)`in the file `flask_app.py` .
    
    ```bash
    python3 ./flask_app.py
    ```
    

### Deployment

We have implemented a CI/CD pipeline on gitlab for deploying the frontend website to lab machine, and deploying backend java app and python analyser on our own server. To deploy the website to your own server and url, you need to edit the deploy stage in the pipeline file.

- Front-end
    
    Basic idea: build the project, put the `build/` folder into your specified web directory

    Notice that you need to set these CI/CD variables in git:
    - SSH_PRIVATE_KEY: Your private key for authentication
    
    <!-- Deploy stage idea: 
    
    ```bash
    deploy:
      stage: deploy
      before_script:
        - {commands to ssh into your server}
      script:
        - scp -r build/* {target dir path in your server that you want to put the code into}
    ``` -->

    Example deploy stage: 
     ```bash
    deploy:
        stage: deploy
        before_script:
        # Preparing ssh environment
        - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
        - eval $(ssh-agent -s)

        # Adding the private key for authentication
        - ssh-add <(echo "$SSH_PRIVATE_KEY")

        #  Configuring SSH settings
        - mkdir -p ~/.ssh
        - chmod 700 ~/.ssh
        - echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config
    script:
        - scp -r build/* user@your-server-ip:{target-dir-path}
    ```
    
- Back-end
    
    Basic idea: build the project, put the `.jar` file into your specified server, select port and launch the service.
    
    Notice that you need to set these CI/CD variables in git:
    
    - REMOTE_USER: Your server user account
    - REMOTE_SERVER: Your server url
    - SSH_PASSWORD: The password of the user account
    
    Example deploy stage:
    
    ```bash
    deploy:
      stage: deploy
      variables:
        EXISTING_PORT: 8080 # If you change the port number in application.properties, you also need to change the port here to match the port number
    		TARGET_PATH: {target_dir_path in your server}
      script:
        - apk add openssh-client
        - apk add sshpass
    
        # search if there is existing pid
        - EXISTING_PID=$(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "lsof -i :$EXISTING_PORT -t || echo 'not_found'")
        - echo "Checking for existing process on port $EXISTING_PORT"
        - echo "EXISTING_PID $EXISTING_PID"
    
        # copy jar to server
        - sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$JAR_FILE" "$REMOTE_USER@$REMOTE_SERVER:$TARGET_PATH"
    
        # if existing, kill it
        - >
          if [ "$EXISTING_PID" != "not_found" ]; then
            echo "Killing existing process on port $EXISTING_PORT with PID $EXISTING_PID"
            sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "kill $EXISTING_PID"
          else
            echo "No existing process found on port $EXISTING_PORT"
          fi
    
        # launch
        - sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "nohup java -jar $TARGET_PATH/IceBreakerBackend-1.0.jar &>/dev/null  &"
    
        - sleep 5
    
        # Show current pid, check whether the launch is successful
        - echo $(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "lsof -i :$EXISTING_PORT -t || echo 'not_found'")
    ```
    
- Analyser:
    
    Basic idea: put the whole project into into your specified server, select port and run the `flask_app.py`

    Notice that, we currently assume the Java Backend and the Python Analyser will run in the same server, therefore when the backend fetch the similarity analysis in file `ReportService` in function `fetchReports`, it set the API of Python Analyser to `pythonServiceUrl = http://localhost:8000/generate_reports`. If in the real deployment, the Python Analyzer will run in a different server, make sure you change this `pythonServiceUrl` variable to the real endpoint. 

    Notice that you need to change these CI/CD variables in git:

    - REMOTE_USER: Your server user account
    - REMOTE_SERVER: Your server url
    - SSH_PASSWORD: The password of the user account
    - DEPLOY_DIRECTORY: target_deployment_path in your server
    - GUNICORN_PORT: port that you want this analyzer to run on

    Example deploy stage:

    ```bash
    deploy:
    stage: deploy
    script:
        # Search for existing pid on port
        - EXISTING_PID=$(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "lsof -i :$GUNICORN_PORT -t || echo 'not_found'")
        - echo "Checking for existing process on port $GUNICORN_PORT"
        - echo "EXISTING_PID $EXISTING_PID"
            # Extract the first PID from the list
        - FIRST_PID=$(echo "$EXISTING_PID" | head -n 1)

        # Kill the first PID if it's not "not_found"
        - >
        if [ "$FIRST_PID" != "not_found" ]; then
            echo "Killing existing process on port $GUNICORN_PORT with PID $FIRST_PID"
            sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "kill $FIRST_PID"
        else
            echo "No existing process found on port $GUNICORN_PORT"
        fi

        # make dir and copy files
        - sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "mkdir -p $DEPLOY_DIRECTORY"
        - sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r ./* "$REMOTE_USER@$REMOTE_SERVER:$DEPLOY_DIRECTORY"
        
        # launch - there is issue with running
        - sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" 'bash -c "{ export PATH=\$PATH:/home/ice/.local/bin && cd {target_dir_path} && nohup gunicorn --workers 2 --bind 0.0.0.0:{target_port} flask_app:app >/dev/null 2>&1 & } < /dev/null > /dev/null 2>&1 &"'

        - sleep 5

        # Show current pid
        - echo $(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$REMOTE_SERVER" "lsof -i :$GUNICORN_PORT -t || echo 'not_found'")
    ```

    Notice that you need to change the following line to match your server's setup:
    ```bash
        export PATH=\$PATH:/home/ice/.local/bin
    ```

    Notice that you need to change the `{target_dir_path}` to the real dir in your server where the `flask_app.py` exists, and change the `{target_port}` to match the `$GUNICORN_PORT`.
    

## System Architecture

### Front-end System Architecture Diagram
<img src="./img/frontendArchitecture.jpg?raw=true" width="800"/>

### Back-end System Architecture Diagram
<img src="./img/backendArchitecture.jpg?raw=true" width="800"/>

### WebSocket and HTTP

Both web socket and HTTP requests are used in the project.

Basically, web socket is in charge of **broadcasting**
information to every user in the same room. It is used to synchronise
everyone’s page.

For example, web socket is used to broadcast RoomStatus changing,
where everyone needs to be navigate to the next page. Also, it is used
in games to ensure everyone can see the real time input of others.

HTTP requests are used to **fetch** and
**post** the status actively.

For example, when user enters a new page, it will use HTTP requests
to get the latest status of the page. This will handle the situation
when user refreshes page. Also, the change RoomStatus signal is sent by
HTTP request, then server can broadcast to everyone in room via web
socket.

## API Documentation

Please access the API documentation via our Gitlab Wiki:
https://gitlab.doc.ic.ac.uk/g236002112/icebreakweb/-/wikis/api-documentation

## Front-end Developer’s Guide

### File Structure in src/

- IceBreaker.java: The main app
- assets/
    - Contains all the background images we designed for pages and
    buttons
- instructions/
    - Contains pictures of the guides we provided within each page
- macro/
    - Global constants: The server port and web socket macro, Google maps
    API key
- utils/
    - Export PDF function
    - Modal control
    - Web Socket Service
    - Room and CSS operation
- HangmanStage.ts
    - Simple ASCII for displaying hangman drawing
    

### CSS and UI component

- CommonStyle.css
    - Contains common UI class using throughout pages
    - :root
        - general colour schemes
        - overlay z-index definitions

### Code Style and Comment

The front-end functions are orgnized in sections.

Before every function, there is a comment to describe when the
function will be called and what it will do.

The common section sequences are as below:

- /* ——– Use Effect ———- */
    - Triggered when dependency fields changed
    - Often used to do intialisation when mount and real time update
- /* ——– Refresh Management ———- */
    - Handle the functions related to window refreshing
- /* ——– Web Socket ———- */
    - Send and receive messeage via websocket
- /* ——– Button Handler ———- */
    - Triggered when user click button, move mouse or type keyboards
- /* ——– Check status ———- */
    - HTTP requests to fetch information from server
- /* ——– Helper function ———- */
    - Standalone functions that support other functions
- /* ——– UI Component ———- */
    - Self-rendered UI components
    - Main renderer

## Back-end Developer’s Guide

### File Structure in src/main/java

- configs/
    - Contains all configurations related to WebSocket
- controllers/
    - Contains all RestControllers and Controllers
    - This is where all API are defined
- dto/
    - games/
        - Contains all classes related to specific games
    - person/
        - Contains the Basic Users classes, where Admin and User classes
        extend the Abstract class Person
    - room/
        - Contains all classes related to Room
    - webSocket/
        - Contains all the message Types
- enums/
    - Contains all enum type classes
- serverrunner/
    - ServerRunner is responsible for connection between services and core logic
- services
    - Contains all Services. Every service is corresponding to a controller.
    - This is where the logic of APIs are defined
- utils/
    - Contains constants and common util functions

### Code Style for Adding new AP

- Depends on the relation between the new API and the Room/Person/Games classes, you may want to add the new API into existed controllers, or create a new controller for it.
- Each controller should have a corresponding service. A controller is an interface between frontend requests and the backend logic. Ideally, controllers should not contain any core logic - they should work as pure proxies, pass the parameters received from the frontend directly down to the services.
- The core logic should stay inside services.

### Code Style for Adding new WebSocket

## Potential Issues and Future Development Guide

### Network Issue

We initially used HTTP requests in most places and used HTTP pull
request every 0.1 second. This caused page to be lagged and stuck when
transferred data grew. Therefore, we changed the overall structure to
using web socket broadcast. This significantly decreased the data
transfered per second and made the game more fluent.

However, there are still some network issues live in the project.
When visiting the website with unstable network, the delay may cause
user to lose connection with the web socket and stuck on some pages.

For the future development, this should a critical problem to
address.

We currently have some thought that may solve the problem

- Broadcast RoomStatus periodically, but less frequently than the
original HTTP pull request
- Use better RoomStatus structure to locate the page should be shown
from any pages
- Use better server. We now used a self-hosted standalone server and
the access from outside UK can be very laggy.

### UI Issue

The UI we design just adapts to the full screen display on the
browser currently, where `position: absolute` is extensively
used for placing UI components instead of using `flex`. This
causes the UI display becoming weird if the browser window size is
reshaped. And for different screen size, the position of the UI
components will also be different.

### Keyboard Issue

In hangman, the expected behaviour of user is to enter only one
character one time. But if someone intentionally press multiple keys at
the same time, multiple characters will be checked and revealed, and the
next few guesser will be skipped.

Similarly in wordle, when multiple keys are pressed, or user types
very fast, the blocks may not be updated accordingly. This is because
the front-end sends web socket message too fast, without getting the
latest feedback from the back-end server.

### GeoGuesser Image Issue

The game process currently is dependent on presenter selecting the
position manually. Some places have street view in Google map while most
of the places are just satellite images which is almost impossible for
the others to guess where it is. We do not have automatic process to
find the latitude and longitude based on the city and country name
entered. So if the present has no idea where the city or the country is
on the map, this would be really tricky when playing this game.