def calculate_average(numbers):
    total = 0
    # Bug: We iterate one time too many, causing an IndexError
    # range(len(numbers) + 1) goes from 0 to len(numbers), which is out of bounds
    for i in range(len(numbers) + 1):
        total += numbers[i]
    return total / len(numbers)

if __name__ == "__main__":
    scores = [85, 90, 78, 92]
    print(f"Average score: {calculate_average(scores)}")
