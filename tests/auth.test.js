const userController = require('../controllers/userController');
const User = require('../models/User');

jest.mock('../models/User');

describe('User authentication', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Registration', () => {
        it('pass if email is unique', async() => {
            const mockData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'new@example.com',
                password: 'password123',
                role: 'User'
            };

            User.findOne.mockResolvedValue(null);

            const mockSave = jest.fn();
            User.mockImplementation(() => ({
                ...mockData,
                save: mockSave
            }));

            const result = await userController.createUser(mockData);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
            expect(mockSave).toHaveBeenCalled();
            expect(result).toMatchObject({ email: 'new@example.com' });
        });

        it('fail if email already exists', async() => {
            const mockData = { email: 'exists@example.com' };

            User.findOne.mockResolvedValue({ email: 'exists@example.com' });

            await expect(userController.createUser(mockData))
                .rejects
                .toThrow('Email already exists');
        });
    });

    describe('Login', () => {
        it('pass if valid credentials', async() => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await userController.loginUser('test@example.com', 'password123');

            expect(User.findOne).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toEqual(mockUser);
        });

        it('fail if invalid credentials', async() => {
            User.findOne.mockResolvedValue(null);

            const result = await userController.loginUser('wrong@example.com', 'wrongpass');

            expect(result).toBeNull();
        });
    });
});