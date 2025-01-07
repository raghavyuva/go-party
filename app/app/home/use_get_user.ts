import React from 'react'

function use_get_user() {
    const [user, setUser] = React.useState<any>(null)

    React.useEffect(() => {
        try {
            const storedUser = localStorage.getItem('persist:root')
            if (!storedUser) return
            const parsedUser = JSON.parse(storedUser)
            if (!parsedUser) return
            const { auth } = parsedUser
            if (!auth) return
            const { user } = JSON.parse(auth)
            if (!user) return
            setUser(user)
        } catch (error) {
            console.error('Failed to parse user from local storage:', error)
        }
    }, [])
 
    return {
        user
    }
}

export default use_get_user