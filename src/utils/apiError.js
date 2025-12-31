class apiError extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        error=[],
                )
        
        {
         super(message)
        this.statusCode = statusCode
        this.data = null
        this.message= message
        this.success = false
        this.error = error


       
    }
       

    
}


export  {apiError}