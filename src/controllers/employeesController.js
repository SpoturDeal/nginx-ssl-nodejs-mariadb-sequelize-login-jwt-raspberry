const { Employees } = require('../models')

const getAllEmployees = async (req, res) => {
    const employees = await Employees.findAll()
    if (!employees)
        return res.status(204).json({ message: 'No employees found.' })
    res.json(employees)
}

const createNewEmployee = async (req, res) => {
    // descructure the req.body
    const { firstname, lastname } = req.body
    if (!firstname || !lastname) {
        return res
            .status(400)
            .json({ message: 'First and last names are required' })
    }

    // create and store
    try {
        const result = await Employees.create({
            firstname: firstname,
            lastname: lastname,
        })
        res.status(201).json(result)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateEmployee = async (req, res) => {
    if (!req?.body?.id) {
        return res.status(400).json({ message: 'ID parameter is required.' })
    }

    const employee = await Employees.findOne({ where: { uuid: req.body.id } })
    if (!employee) {
        return res
            .status(204)
            .json({ message: `No employee matches ID ${req.body.id}.` })
    }
    // descructure the req.body
    const { firstname, lastname } = req.body
    if (req.body?.firstname) employee.firstname = firstname
    if (req.body?.lastname) employee.lastname = lastname
    const result = await employee.save()
    res.json(result)
}

const deleteEmployee = async (req, res) => {
    if (!req?.body?.id)
        return res.status(400).json({ message: 'Employee ID required.' })

    const employee = await Employees.findOne({ where: { uuid: req.body.id } })

    if (!employee) {
        return res
            .status(204)
            .json({ message: `No employee matches ID ${req.body.id}.` })
    }

    const result = await employee.destroy() //{ _id: req.body.id }
    res.json(result)
}

const getEmployee = async (req, res) => {
    if (!req?.params?.id)
        return res.status(400).json({ message: 'Employee ID required.' })

    const employee = await Employees.findOne({ where: { uuid: req.params.id } })

    if (!employee) {
        return res
            .status(204)
            .json({ message: `No employee matches ID ${req.params.id}.` })
    }

    res.json(employee)
}

module.exports = {
    getAllEmployees,
    createNewEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
}
