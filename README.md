# Unit 4: Additional Features

## Getting started

The frontend can be found in `client/` and the backend can be found in `server/`.
They are separate projects and must be run separately (in different terminals).

The server requires environment variables to be set. See `server/.env.example` for
the required environment variables (copy this file to `.env` and fill in the values).

For each project, you can run the following commands:

- `npm install` to install dependencies
- `npm run dev` to run the development server
  Runs the app in the development mode.\
  Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

- `npm run lint` to run the linter
- `npm run test` to run tests (backend only)

### Notable Design Choices

1. Created a GraphVizModal to visualize graphs for nodes and their links.
2. Created a SearchResultsModal which goes full-screen and allows the user to see their search results and filter/sort their results.
3. Created a custom SearchBar component
4. Modified backend to have a new endpoint "/search/:query" which uses mongodb to query through the nodes.

## Deployed Backend URL

https://cs1951v-editablenodes.onrender.com

## Deployed Frontend URL

https://cs1951v-unit3-editable-nodes.vercel.app/

## Capstone / Extra Credit

N/A

## Known Bugs

None

## Estimated Hours Taken

15 hours
