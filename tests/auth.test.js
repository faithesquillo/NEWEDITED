const userController = require('../controllers/userController');
const User = require('../models/User');

jest.mock('../models/User');

describe('User Authentication', () => {

    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Registration', () => {

        it('pass if email is unique', async() => {
            const req = {
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'unique@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                    role: 'User'
                }
            };
            const res = mockResponse();

            User.findOne.mockResolvedValue(null);

            const mockSave = jest.fn();
            User.mockImplementation(() => ({
                save: mockSave,
                _id: 'new_user_id'
            }));

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('fail if email already exists', async() => {
            const req = {
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'exists@example.com',
                    password: '123',
                    confirmPassword: '123'
                }
            };
            const res = mockResponse();

            User.findOne.mockResolvedValue({ email: 'exists@example.com' });

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Email already exists'
            }));
        });

        it('fail if passwords do not match', async() => {
            const req = {
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test@test.com',
                    password: '123',
                    confirmPassword: '999'
                }
            };
            const res = mockResponse();

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Passwords do not match'
            }));
        });

        it('fail if required fields are missing', async() => {
            const req = { body: { firstName: 'John' } };
            const res = mockResponse();

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('fill in all fields')
            }));
        });
    });

    describe('Login', () => {

        it('pass if valid credentials', async() => {
            const req = {
                body: { email: 'valid@test.com', password: 'password123' },
                session: {}
            };
            const res = mockResponse();

            const mockUser = {
                _id: '123',
                email: 'valid@test.com',
                password: '$2b$10$FakeHashedPassword...',
                firstName: 'John',
                lastName: 'Doe',
                role: 'User',
                comparePassword: jest.fn().mockResolvedValue(true)
            };

            User.findOne.mockResolvedValue(mockUser);

            await userController.loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Login successful!'
            }));
        });

        it('fail if invalid credentials', async() => {
            const req = {
                body: { email: 'wrong@test.com', password: 'wrong' }
            };
            const res = mockResponse();

            const mockUser = {
                email: 'wrong@test.com',
                comparePassword: jest.fn().mockResolvedValue(false)
            };
            User.findOne.mockResolvedValue(mockUser);

            await userController.loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid email or password'
            }));
        });

        it('fail if fields are missing', async() => {
            const req = { body: { email: 'only@email.com' } };
            const res = mockResponse();

            await userController.loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Email and password are required'
            }));
        });
    });
});