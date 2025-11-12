// Define a function named "asynchandler" that takes another function "fn" as an argument
const asynchandler = (fn) => 
  // Return a new async function that Express will use as a route handler
  async (req, res, next) => {
    try {
      // Execute the passed function (controller) and wait for it to finish
      await fn(req, res, next)
    } catch (error) {
      // If an error occurs, send a JSON response with the error status and message
      res.status(200).json({
        success: false,          // Indicates the request failed
        message: error.message  // Sends the error message to the client
      })
    }
  }

// Export the asynchandler function so it can be imported in other files
export { asynchandler }
